import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Clock,
  Zap,
  Construction,
  ArrowLeft,
  NotebookPen,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { getCurrentUser } from '../services/authService';
import { getWizardWorkflows, getPublicWizardWorkflows } from '../services/wizardService';

export default function MetalSelection({ onSelect }) {
  const { sidebarOpen } = useSidebar();
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const actionRefs = useRef([]);
  const headerRef = useRef(null);

  const [stage, setStage] = useState('metal');
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [openProjectsExpanded, setOpenProjectsExpanded] = useState(false);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Animate metal cards when stage is "metal"
  useEffect(() => {
    if (stage !== 'metal' || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(headerRef.current, { opacity: 0, y: -30 });
      gsap.set(cardRefs.current, { opacity: 0, y: 60, scale: 0.95 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to(headerRef.current, { opacity: 1, y: 0, duration: 0.8 })
        .to(
          cardRefs.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
          },
          '-=0.4'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [stage]);

  // Animate action panels when stage switches to "action"
  useEffect(() => {
    if (stage !== 'action' || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        actionRefs.current,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.15,
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [stage]);

  // Fetch current user and recent projects
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const uid = user._id || user.id;
      // Fetch projects for the selected metal, or all projects if no metal selected yet
      fetchRecentProjects(uid, selectedMetal);
    }
  }, [selectedMetal]);

  // Initial fetch on component mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const uid = user._id || user.id;
      fetchRecentProjects(uid, null); // Fetch all projects initially
    }
  }, []);

  // (Reverted) No secondary fetch on action stage; initial mount fetch suffices

  const fetchRecentProjects = async (userId, metal) => {
    try {
      setLoadingProjects(true);
      // Determine backend metalType value
      let metalTypeFilter = undefined;
      if (metal === 'aluminum') metalTypeFilter = 'Aluminium';
      else if (metal === 'copper') metalTypeFilter = 'Copper';

      const response = await getWizardWorkflows({
        limit: 10,
        sort: '-updatedAt',
        metalType: metalTypeFilter,
      });

      let workflows = response?.data?.workflows || [];

      // Client-side filtering as additional safety
      if (metalTypeFilter) {
        workflows = workflows.filter(w => w.metalType === metalTypeFilter);
      }

      setRecentProjects(workflows);
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      setRecentProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCardHover = (index, isEntering) => {
    if (stage !== 'metal') return;
    gsap.to(cardRefs.current[index], {
      y: isEntering ? -8 : 0,
      scale: isEntering ? 1.02 : 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMetalSelect = (metalType) => {
    if (metalType !== 'aluminum' && metalType !== 'steel' && metalType !== 'copper') return;
    setSelectedMetal(metalType);
    setStage('action');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const playExitAnimation = (callback) => {
    if (!containerRef.current) {
      callback?.();
      return;
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: callback,
    });
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    if (!projectName.trim()) return;

    const payload = {
      metal: selectedMetal,
      mode: 'create',
      projectName: projectName.trim(),
      projectDescription: projectDescription.trim(),
    };

    playExitAnimation(() => onSelect(payload));
  };

  const handleBackToMetals = () => {
    setStage('metal');
    setSelectedMetal(null);
    setProjectName('');
    setProjectDescription('');
    setOpenProjectsExpanded(false);
    // Fetch all projects when going back to metal selection
    const user = getCurrentUser();
    if (user) {
      const uid = user._id || user.id;
      fetchRecentProjects(uid, null);
    }
  };

  const handleLoadExistingWorkflow = (workflowId) => {
    // Find the workflow in recentProjects to get its metalType
    const workflow = recentProjects.find(w => w._id === workflowId);
    const workflowMetalType = workflow?.metalType;
    
    // Determine metal from workflow's metalType, fallback to selectedMetal
    let metal = selectedMetal || 'aluminum';
    if (workflowMetalType === 'Copper') metal = 'copper';
    else if (workflowMetalType === 'Aluminium') metal = 'aluminum';
    else if (workflowMetalType === 'Steel') metal = 'steel';
    
    const payload = {
      metal: metal,
      mode: 'load',
      workflowId: workflowId
    };
    
    playExitAnimation(() => onSelect(payload));
  };

  const renderActionStage = () => {
    const metalConfig = {
      aluminum: {
        color: 'stone',
        label: 'Aluminum',
        description: 'aluminum workflows',
        wizardLabel: 'Launch aluminum wizard',
      },
      copper: {
        color: 'clay',
        label: 'Copper',
        description: 'copper workflows',
        wizardLabel: 'Launch copper wizard',
      },
    };

    const colorClasses = {
      stone: {
        badge: 'bg-[#F1EBE5] text-[#6B5B59]',
        text: 'text-[#6B5B59]',
        cardBorder: 'border-[#DDD1C9] shadow-[0_12px_28px_rgba(107,91,89,0.12)]',
        iconBg: 'bg-[#E8DDD6] text-[#5A4D49]',
        buttonBg: 'bg-[#6B5B59] hover:bg-[#5C4F4B]',
        focusBorder: 'focus:border-[#6B5B59] focus:ring-[#6B5B59]/15',
        infoBox: 'bg-[#F5EEE9] border-[#DDD1C9] text-[#4C413D]',
        drawerBg: 'from-[#F7F2EE] via-[#F9F6F3] to-white',
        drawerGradient: 'from-[#E4D8D0]/60',
        drawerIconBg: 'bg-white/80 text-[#6B5B59]',
        drawerText: 'text-[#6B5B59]',
        drawerTitle: 'text-[#4C413D]',
        drawerPill: 'text-[#86756F]',
        drawerInfoBox: 'bg-white/80 border-[#DAD0C8]',
        drawerInfoText: 'text-[#4C413D]',
        drawerInfoSubtext: 'text-[#6F615C]',
        drawerCardBg: 'bg-white/85 border-[#D7CBC3]',
        drawerHandle: 'bg-[#CFC2B9]',
        drawerHandleText: 'text-[#6B5B59]',
        drawerBorder: 'border-[#D7CBC3]',
        drawerContentText: 'text-[#4C413D]',
        drawerChevron: 'text-[#A89A93]',
        drawerContentSubtext: 'text-[#7C6F6A]',
        drawerDashed: 'border-[#D6C9C2] bg-[#F4ECE7]',
        drawerButton: 'border-[#D6C9C2] text-[#6B5B59]',
        drawerFooter: 'text-[#7C6F6A]',
      },
      clay: {
        badge: 'bg-[#F5E8E2] text-[#BA7967]',
        text: 'text-[#BA7967]',
        cardBorder: 'border-[#EDD8CB] shadow-[0_12px_28px_rgba(186,121,103,0.14)]',
        iconBg: 'bg-[#F2E2DA] text-[#BA7967]',
        buttonBg: 'bg-[#BA7967] hover:bg-[#A86B5C]',
        focusBorder: 'focus:border-[#BA7967] focus:ring-[#BA7967]/20',
        infoBox: 'bg-[#F9F0EC] border-[#EDD8CB] text-[#8A5A4A]',
        drawerBg: 'from-[#FBF3EF] via-[#FDF8F5] to-white',
        drawerGradient: 'from-[#EFDCD1]/60',
        drawerIconBg: 'bg-white/80 text-[#BA7967]',
        drawerText: 'text-[#B07260]',
        drawerTitle: 'text-[#8A5A4A]',
        drawerPill: 'text-[#A86B5C]',
        drawerInfoBox: 'bg-white/80 border-[#EBD5C7]',
        drawerInfoText: 'text-[#8A5A4A]',
        drawerInfoSubtext: 'text-[#A97A69]',
        drawerCardBg: 'bg-white/85 border-[#E8CFC0]',
        drawerHandle: 'bg-[#D9B8A9]',
        drawerHandleText: 'text-[#9C6856]',
        drawerBorder: 'border-[#E8CFC0]',
        drawerContentText: 'text-[#8A5A4A]',
        drawerChevron: 'text-[#C08B76]',
        drawerContentSubtext: 'text-[#B27A66]',
        drawerDashed: 'border-[#E4C5B4] bg-[#F9EFEA]',
        drawerButton: 'border-[#E4C5B4] text-[#B07260]',
        drawerFooter: 'text-[#A26956]',
      },
    };

    const config = metalConfig[selectedMetal] || metalConfig.aluminum;
    const colors = colorClasses[config.color] || colorClasses.stone;

    return (
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${colors.text} font-semibold`}>Step 2</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">How would you like to continue?</h2>
            <p className="text-sm text-gray-600 mt-1">
              Build a fresh {selectedMetal} project or relaunch one you worked on earlier.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full ${colors.badge} px-3 py-1.5 text-xs`}>
              <Sparkles className="h-3.5 w-3.5" />
              {config.label} mode unlocked
            </div>
            <Button variant="ghost" onClick={handleBackToMetals} className="text-gray-600 hover:text-gray-900 text-sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Change metal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            ref={(el) => (actionRefs.current[0] = el)}
            className={`rounded-2xl ${colors.cardBorder} bg-white shadow-lg`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${colors.iconBg}`}>
                    <NotebookPen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] ${colors.text} font-semibold`}>
                      Create
                    </p>
                    <CardTitle className="text-xl">New Project</CardTitle>
                  </div>
                </div>
                <span className={`text-xs font-medium ${colors.text}`}>Guided flow</span>
              </div>
              <CardDescription className="text-sm text-gray-600 mt-3">
                Give your project a name and tell us what it's about. We'll prime the wizard with
                tailored prompts and checkpoints for {config.description}.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <form className="space-y-4" onSubmit={handleCreateSubmit}>
                <div className="space-y-2">
                  <label htmlFor="project-name" className="text-sm font-medium text-gray-700">
                    Project name
                  </label>
                  <Input
                    id="project-name"
                    placeholder="LCA Wizard - 11/11/2025"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="project-description" className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    rows={4}
                    placeholder="Wizard based lifecyle assessment"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className={`w-full rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white ${colors.focusBorder} focus:ring-2 px-4 py-3 text-base text-gray-800 transition`}
                  />
                </div>
                <div className={`rounded-2xl ${colors.infoBox} border border-dashed p-4 text-sm`}>
                  We'll auto-save as you go and sync analytics with your dashboard once the wizard is
                  complete.
                </div>
                <Button
                  type="submit"
                  disabled={!projectName.trim()}
                  className={`w-full h-12 text-base font-semibold ${colors.buttonBg} disabled:bg-gray-300 disabled:text-gray-500`}
                >
                  {config.wizardLabel}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div
            ref={(el) => (actionRefs.current[1] = el)}
            className={`rounded-2xl bg-linear-to-br ${colors.drawerBg} shadow-lg relative overflow-hidden`}
          >
            <div className={`absolute inset-x-0 top-0 h-24 bg-linear-to-b ${colors.drawerGradient} to-transparent`} />
            <div className="relative p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${colors.drawerIconBg} shadow`}>
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] ${colors.drawerText} font-semibold`}>
                      Open
                    </p>
                    <h3 className={`text-xl font-semibold ${colors.drawerTitle}`}>Recent Projects</h3>
                  </div>
                </div>
                <span className={`text-xs font-medium ${colors.drawerPill}`}>Drag to reveal</span>
                <span className={`text-sm font-medium ${colors.drawerPill}`}>Your recent {config.label} workflows</span>
              </div>

              <div className={`rounded-xl ${colors.drawerInfoBox} border p-3`}>
                <p className={`text-xs ${colors.drawerInfoText} font-medium`}>Pull the drawer down</p>
                <p className={`text-xs ${colors.drawerInfoSubtext}`}>
                  We'll surface your previously opened wizard sessions here. No dummy data until you've
                  actually run projects — just a clean staging area.
                </p>
              </div>
              {currentUser && (
                <div className={`rounded-2xl ${colors.drawerInfoBox} border p-4`}>
                  <p className={`text-sm ${colors.drawerInfoText} font-medium`}>Recent {config.label} Projects</p>
                  <p className={`text-sm ${colors.drawerInfoSubtext}`}>
                    Select a project below to reopen its wizard workflow.
                  </p>
                </div>
              )}

              <div className={`rounded-3xl border ${colors.drawerBorder} bg-white/80 overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setOpenProjectsExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className={`text-xs font-semibold ${colors.drawerContentText}`}>Local wizard projects</p>
                    <p className={`text-sm font-semibold ${colors.drawerContentText}`}>Recent {config.label} Workflows</p>
                    <p className={`text-xs ${colors.drawerContentSubtext}`}>
                      {recentProjects.length} total
                    </p>
                  </div>
                  {openProjectsExpanded ? (
                    <ChevronUp className={`h-4 w-4 ${colors.drawerChevron}`} />
                  ) : (
                    <ChevronDown className={`h-4 w-4 ${colors.drawerChevron}`} />
                  )}
                </button>
                <div
                  className={`transition-[max-height] duration-300 ${openProjectsExpanded ? 'max-h-96' : 'max-h-0'} overflow-hidden`}
                >
                  <div className={`px-6 pb-6 space-y-3 text-sm ${colors.drawerContentText}`}>
                    {loadingProjects ? (
                      <div className="text-center py-4">
                        <div className="w-4 h-4 border-2 border-[#6B5B59] border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs mt-2">Loading...</p>
                      </div>
                    ) : recentProjects.length > 0 ? (
                      recentProjects.map(project => (
                        <button
                          key={project._id}
                          onClick={() => handleLoadExistingWorkflow(project._id)}
                          className="w-full text-left p-3 rounded-lg border border-[#E3D7CF] hover:border-[#6B5B59] hover:bg-[#F7F2EE] transition-all group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#6B5B59]">
                                {project.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {project.description || 'No description'}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                                <span>{project.completionPercentage || 0}% complete</span>
                              </div>
                            </div>
                            <div className="ml-2 shrink-0">
                              <div className={`w-2 h-2 rounded-full ${
                                project.status === 'completed' ? 'bg-green-400' :
                                project.status === 'submitted' ? 'bg-blue-400' :
                                project.completionPercentage > 0 ? 'bg-yellow-400' : 'bg-gray-300'
                              }`} />
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500">No recent {config.label.toLowerCase()} workflows</p>
                        <p className="text-xs text-gray-400 mt-1">Create a project on the left to see it here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <p className={`text-xs ${colors.drawerFooter}`}>
                Want this to auto-populate? Connect your wizard history API and hydrate the list with
                real sessions when they're available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMetalStage = () => (
    <>
      <div ref={headerRef} className="text-center mb-6 space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Choose Your Metal</h1>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          Select the metal type for your lifecycle assessment project
        </p>
      </div>

      {/* Aluminium */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
        <div
          ref={(el) => (cardRefs.current[0] = el)}
          onMouseEnter={() => handleCardHover(0, true)}
          onMouseLeave={() => handleCardHover(0, false)}
          className="cursor-pointer"
        >
          <Card className="bg-white border-[#E0D5CC] hover:border-[#6B5B59] hover:shadow-xl transition-all duration-300 h-full group">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#E5D9CF] via-[#F7F1EA] to-[#DED2C9] border-2 border-[#CFC2B9] flex items-center justify-center shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/40 to-transparent"></div>
                  <Zap className="w-7 h-7 text-[#6B5B59] relative z-10" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EBE5] border border-[#E3D7CF] rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#6B5B59]" />
                  <span className="text-xs font-medium text-[#6B5B59]">Available</span>
                </div>
              </div>
              <CardTitle className="text-2xl text-gray-900 mb-1">Aluminum</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Complete lifecycle assessment for aluminum production and recycling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                  <p className="flex-1">Mining and ore extraction analysis</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                  <p className="flex-1">Beneficiation and refining processes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                  <p className="flex-1">Manufacturing and recycling workflows</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#6B5B59] mt-1.5" />
                  <p className="flex-1">AI-powered predictions and insights</p>
                </div>
              </div>
              <Button
                onClick={() => handleMetalSelect('aluminum')}
                className="w-full bg-linear-to-r from-[#6B5B59] to-[#5C4F4B] hover:from-[#5C4F4B] hover:to-[#4F4441] text-white font-semibold py-6 text-lg shadow-md group-hover:shadow-lg transition-all mb-4"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start with Aluminum
              </Button>
              
              {/* Recent Projects Section */}
              {currentUser && (
                <div className="border-t border-[#E3D7CF] pt-4">
                  <button
                    onClick={() => setOpenProjectsExpanded(!openProjectsExpanded)}
                    className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-[#F7F2EE] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#6B5B59]" />
                      <span className="text-sm font-medium text-[#6B5B59]">Recent Projects</span>
                      {recentProjects.length > 0 && (
                        <span className="text-xs bg-[#F1EBE5] text-[#6B5B59] px-2 py-0.5 rounded-full">
                          {recentProjects.length}
                        </span>
                      )}
                    </div>
                    {openProjectsExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#6B5B59] group-hover:text-[#5C4F4B]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#6B5B59] group-hover:text-[#5C4F4B]" />
                    )}
                  </button>
                  
                  {openProjectsExpanded && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {loadingProjects ? (
                        <div className="text-center py-4">
                          <div className="w-4 h-4 border-2 border-[#6B5B59] border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs text-[#6B5B59] mt-2">Loading projects...</p>
                        </div>
                      ) : recentProjects.length > 0 ? (
                        recentProjects.map((project) => (
                          <button
                            key={project._id}
                            onClick={() => handleLoadExistingWorkflow(project._id)}
                            className="w-full text-left p-3 rounded-lg border border-[#E3D7CF] hover:border-[#6B5B59] hover:bg-[#F7F2EE] transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#6B5B59]">
                                  {project.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {project.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {project.completionPercentage || 0}% complete
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 shrink-0">
                                <div className={`w-2 h-2 rounded-full ${
                                  project.status === 'completed' ? 'bg-green-400' :
                                  project.status === 'submitted' ? 'bg-blue-400' :
                                  project.completionPercentage > 0 ? 'bg-yellow-400' : 'bg-gray-300'
                                }`} />
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No recent aluminum projects</p>
                          <p className="text-xs text-gray-400 mt-1">Start a new workflow to see it here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Copper Card */}
        <div
          ref={(el) => (cardRefs.current[1] = el)}
          onClick={() => handleMetalSelect('copper')}
          onMouseEnter={() => handleCardHover(1, true)}
          onMouseLeave={() => handleCardHover(1, false)}
          className="cursor-pointer"
        >
          <Card className="bg-white border-[#EDD8CB] hover:border-[#BA7967] hover:shadow-xl transition-all duration-300 h-full group">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-[#F2E2DA] via-[#F9F0EC] to-[#EDD8CB] border-2 border-[#D9B8A9] flex items-center justify-center shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/40 to-transparent"></div>
                  <Construction className="w-7 h-7 text-[#BA7967] relative z-10" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5E8E2] border border-[#EDD8CB] rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-[#BA7967]" />
                  <span className="text-xs font-medium text-[#BA7967]">Available</span>
                </div>
              </div>
              <CardTitle className="text-2xl text-gray-900 mb-1">Copper</CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                Complete lifecycle assessment for copper production and recycling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                  <p className="flex-1">Mining and ore extraction analysis</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                  <p className="flex-1">Beneficiation and refining processes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                  <p className="flex-1">Manufacturing and recycling workflows</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BA7967] mt-1.5" />
                  <p className="flex-1">AI-powered predictions and insights</p>
                </div>
              </div>
              <Button
                onClick={() => handleMetalSelect('copper')}
                className="w-full bg-linear-to-r from-[#BA7967] to-[#A86B5C] hover:from-[#A86B5C] hover:to-[#96604F] text-white font-semibold py-6 text-lg shadow-md group-hover:shadow-lg transition-all mb-4"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start with Copper
              </Button>
              
              {/* Recent Projects Section */}
              {currentUser && (
                <div className="border-t border-[#EDD8CB] pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenProjectsExpanded(!openProjectsExpanded);
                    }}
                    className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-[#F9F0EC] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-[#BA7967]" />
                      <span className="text-sm font-medium text-[#BA7967]">Recent Projects</span>
                      {recentProjects.filter(p => p.metalType === 'Copper').length > 0 && (
                        <span className="text-xs bg-[#F5E8E2] text-[#BA7967] px-2 py-0.5 rounded-full">
                          {recentProjects.filter(p => p.metalType === 'Copper').length}
                        </span>
                      )}
                    </div>
                    {openProjectsExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#BA7967] group-hover:text-[#A86B5C]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#BA7967] group-hover:text-[#A86B5C]" />
                    )}
                  </button>
                  
                  {openProjectsExpanded && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {loadingProjects ? (
                        <div className="text-center py-4">
                          <div className="w-4 h-4 border-2 border-[#BA7967] border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-xs text-[#BA7967] mt-2">Loading projects...</p>
                        </div>
                      ) : recentProjects.filter(p => p.metalType === 'Copper').length > 0 ? (
                        recentProjects.filter(p => p.metalType === 'Copper').map((project) => (
                          <button
                            key={project._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadExistingWorkflow(project._id);
                            }}
                            className="w-full text-left p-3 rounded-lg border border-[#EDD8CB] hover:border-[#BA7967] hover:bg-[#F9F0EC] transition-all group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-[#BA7967]">
                                  {project.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {project.description || 'No description'}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(project.updatedAt).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {project.completionPercentage || 0}% complete
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 shrink-0">
                                <div className={`w-2 h-2 rounded-full ${
                                  project.status === 'completed' ? 'bg-green-400' :
                                  project.status === 'submitted' ? 'bg-blue-400' :
                                  project.completionPercentage > 0 ? 'bg-yellow-400' : 'bg-gray-300'
                                }`} />
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No recent copper projects</p>
                          <p className="text-xs text-gray-400 mt-1">Start a new workflow to see it here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-xs">More metals will be available soon. Stay tuned!</p>
      </div>
    </>
  );

  return (
    <div 
      className={cn(
        "fixed z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4",
        sidebarOpen ? "left-[260px]" : "left-16",
        "right-0 top-16 bottom-0"
      )}
    >
      <div
        ref={containerRef}
        className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl border border-[#efe4d5] max-h-[85vh] overflow-y-auto"
      >
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-8">
          {stage === 'metal' ? renderMetalStage() : renderActionStage()}
        </div>
      </div>
    </div>
  );
}