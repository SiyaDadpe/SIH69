"""
Continuous MongoDB Monitor for Workflow Predictions
Polls MongoDB for new/updated workflows and runs predictions automatically
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable, Any
import os

logger = logging.getLogger(__name__)


class ContinuousWorkflowMonitor:
    """
    Monitors MongoDB for workflows created/modified within last 10 minutes
    and automatically runs predictions on them.
    """
    
    def __init__(
        self,
        get_db_func: Callable,
        predict_func: Callable,
        stage_name: str,
        poll_interval: int = 30,  # seconds between polls
        freshness_window: int = 600,  # 10 minutes in seconds
        object_id_class: Any = None,
        is_async_db: bool = True
    ):
        """
        Initialize continuous monitor.
        
        Args:
            get_db_func: Function that returns MongoDB database connection
            predict_func: Async function that runs prediction for a workflow_id
            stage_name: Name of the stage (mining, beneficiation, etc.)
            poll_interval: Seconds between each poll (default 30s)
            freshness_window: Only process objects modified within this window (default 600s = 10min)
            object_id_class: ObjectId class for MongoDB
            is_async_db: Whether DB operations are async (motor) or sync (pymongo)
        """
        self.get_db_func = get_db_func
        self.predict_func = predict_func
        self.stage_name = stage_name
        self.poll_interval = poll_interval
        self.freshness_window = freshness_window
        self.object_id_class = object_id_class
        self.is_async_db = is_async_db
        self.running = False
        self.prediction_count = 0  # Track total predictions made
        # Track processed workflow IDs and last cleanup time
        self.processed_ids = set()
        self.last_cleanup = datetime.utcnow()
        
    async def start(self):
        """Start continuous monitoring in background."""
        self.running = True
        logger.info(f"🔄 Starting continuous monitor for {self.stage_name} stage")
        logger.info(f"   Poll interval: {self.poll_interval}s, Freshness window: {self.freshness_window}s")
        
        while self.running:
            try:
                await self._poll_and_process()
            except Exception as e:
                logger.error(f"Error in continuous monitor for {self.stage_name}: {e}")
            
            # Cleanup old processed IDs every hour
            if (datetime.utcnow() - self.last_cleanup).total_seconds() > 3600:
                self._cleanup_processed_ids()
            
            await asyncio.sleep(self.poll_interval)
    
    def stop(self):
        """Stop continuous monitoring."""
        self.running = False
        logger.info(f"⏹️  Stopping continuous monitor for {self.stage_name} stage")
    
    async def _poll_and_process(self):
        """Poll MongoDB and process fresh workflows."""
        db = await self.get_db_func() if self.is_async_db else self.get_db_func()
        if db is None:
            logger.debug(f"DB not available for {self.stage_name} monitor")
            return
        
        try:
            # Calculate cutoff time (only process workflows modified in last 10 minutes)
            cutoff_time = datetime.utcnow() - timedelta(seconds=self.freshness_window)
            
            # Query for fresh workflows
            query = {
                "$or": [
                    {"updatedAt": {"$gte": cutoff_time}},
                    {"createdAt": {"$gte": cutoff_time}}
                ],
                "status": {"$in": ["draft", "submitted", "in_progress"]}  # Skip completed workflows
            }
            
            # Fetch workflows
            if self.is_async_db:
                cursor = db["wizardworkflows"].find(query).sort("updatedAt", -1).limit(50)
                workflows = await cursor.to_list(length=50)
            else:
                cursor = db["wizardworkflows"].find(query).sort("updatedAt", -1).limit(50)
                workflows = list(cursor)
            
            if not workflows:
                logger.debug(f"No fresh workflows found for {self.stage_name}")
                return
            
            logger.info(f"📋 Found {len(workflows)} fresh workflow(s) for {self.stage_name}")
            
            # Process each workflow
            for wf in workflows:
                workflow_id = str(wf.get("_id"))
                
                # Skip if already processed recently
                if workflow_id in self.processed_ids:
                    continue
                
                # Check if stage has data
                stage_data = wf.get(self.stage_name)
                if not stage_data or not isinstance(stage_data, dict):
                    logger.debug(f"Workflow {workflow_id} has no {self.stage_name} data")
                    continue
                
                # Check if predictions already exist
                ai_predictions = stage_data.get("aiPredictions")
                if ai_predictions and isinstance(ai_predictions, dict) and len(ai_predictions) > 0:
                    logger.debug(f"Workflow {workflow_id} already has {self.stage_name} predictions")
                    self.processed_ids.add(workflow_id)
                    continue
                
                # Run prediction
                try:
                    logger.info(f"🤖 Running {self.stage_name} prediction for workflow {workflow_id}")
                    result = await self.predict_func(workflow_id)
                    
                    if result and result.get("success"):
                        logger.info(f"✅ Successfully predicted {self.stage_name} for workflow {workflow_id}")
                        logger.info(f"   Confidence: {result.get('avgConfidence', 0):.2f}")
                        self.processed_ids.add(workflow_id)
                    else:
                        logger.warning(f"⚠️  Prediction failed for workflow {workflow_id}")
                        
                except Exception as e:
                    logger.error(f"❌ Error predicting {self.stage_name} for workflow {workflow_id}: {e}")
                
                # Small delay between predictions to avoid overload
                await asyncio.sleep(1)
                
        except Exception as e:
            logger.error(f"Error polling workflows for {self.stage_name}: {e}")
    
    def _cleanup_processed_ids(self):
        """Clean up old processed IDs to prevent memory bloat."""
        # Keep only last 1000 processed IDs
        if len(self.processed_ids) > 1000:
            # Convert to list, keep last 500
            ids_list = list(self.processed_ids)
            self.processed_ids = set(ids_list[-500:])
            logger.info(f"Cleaned up processed IDs cache for {self.stage_name}")
        self.last_cleanup = datetime.utcnow()


async def start_monitor_in_background(monitor: ContinuousWorkflowMonitor):
    """Helper to start monitor as background task."""
    asyncio.create_task(monitor.start())
