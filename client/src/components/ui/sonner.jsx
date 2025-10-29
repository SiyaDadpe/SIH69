import React from 'react';
import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner } from 'sonner';

const Toaster = (props) => (
    <Sonner
        theme="light"
        className="toaster group"
        icons={{
            success: <CircleCheckIcon className="h-4 w-4" />,
            info: <InfoIcon className="h-4 w-4" />,
            warning: <TriangleAlertIcon className="h-4 w-4" />,
            error: <OctagonXIcon className="h-4 w-4" />,
            loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
        }}
        style={{
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
            '--border-radius': 'var(--radius)',
        }}
        {...props}
    />
);

export { Toaster };
