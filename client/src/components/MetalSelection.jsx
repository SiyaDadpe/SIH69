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
} from 'lucide-react';

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
    if (metalType !== 'aluminum' && metalType !== 'copper') return;
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
      <div className="w-full max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 text-center sm:text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={`text-sm uppercase tracking-[0.3em] ${colors.text} font-semibold`}>Step 2</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">How would you like to continue?</h2>
            <p className="text-gray-600 mt-2">
              Build a fresh {selectedMetal} project or relaunch one you worked on earlier.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className={`flex items-center gap-2 rounded-full ${colors.badge} px-4 py-2 text-sm`}>
              <Sparkles className="h-4 w-4" />
              {config.label} mode unlocked
            </div>
            <Button variant="ghost" onClick={handleBackToMetals} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change metal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            ref={(el) => (actionRefs.current[0] = el)}
            className={`rounded-3xl ${colors.cardBorder} bg-white shadow-lg`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${colors.iconBg}`}>
                    <NotebookPen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] ${colors.text} font-semibold`}>
                      Create
                    </p>
                    <CardTitle className="text-3xl">New Project</CardTitle>
                  </div>
                </div>
                <span className={`text-sm font-medium ${colors.text}`}>Guided flow</span>
              </div>
              <CardDescription className="text-base text-gray-600 mt-4">
                Give your project a name and tell us what it's about. We'll prime the wizard with
                tailored prompts and checkpoints for {config.description}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleCreateSubmit}>
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
            className={`rounded-3xl bg-linear-to-br ${colors.drawerBg} shadow-lg relative overflow-hidden`}
          >
            <div className={`absolute inset-x-0 top-0 h-32 bg-linear-to-b ${colors.drawerGradient} to-transparent`} />
            <div className="relative p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${colors.drawerIconBg} shadow`}>
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.4em] ${colors.drawerText} font-semibold`}>
                      Open
                    </p>
                    <h3 className={`text-3xl font-semibold ${colors.drawerTitle}`}>Recent Projects</h3>
                  </div>
                </div>
                <span className={`text-sm font-medium ${colors.drawerPill}`}>Drag to reveal</span>
              </div>

              <div className={`rounded-2xl ${colors.drawerInfoBox} border p-4`}>
                <p className={`text-sm ${colors.drawerInfoText} font-medium`}>Pull the drawer down</p>
                <p className={`text-sm ${colors.drawerInfoSubtext}`}>
                  We'll surface your previously opened wizard sessions here. No dummy data until you've
                  actually run projects — just a clean staging area.
                </p>
              </div>

              <div className={`rounded-3xl border border-dashed ${colors.drawerBorder} bg-white/80 overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setOpenProjectsExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div>
                    <p className={`text-sm font-semibold ${colors.drawerContentText}`}>Local wizard projects</p>
                    <p className={`text-xs ${colors.drawerContentSubtext}`}>
                      No local drafts yet
                    </p>
                  </div>
                  {openProjectsExpanded ? (
                    <ChevronUp className={`h-5 w-5 ${colors.drawerChevron}`} />
                  ) : (
                    <ChevronDown className={`h-5 w-5 ${colors.drawerChevron}`} />
                  )}
                </button>
                <div
                  className={`transition-[max-height] duration-300 ${openProjectsExpanded ? 'max-h-96' : 'max-h-0'} overflow-hidden`}
                >
                  <div className={`px-6 pb-6 space-y-3 text-sm ${colors.drawerContentText}`}>
                    <p className={`text-sm ${colors.drawerContentSubtext}`}>
                      Create a project on the left to populate this list.
                    </p>
                  </div>
                </div>
              </div>

              <p className={`text-sm ${colors.drawerFooter}`}>
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
      <div ref={headerRef} className="text-center mb-12 space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Choose Your Metal</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#E5D9CF] via-[#F7F1EA] to-[#DED2C9] border-2 border-[#CFC2B9] flex items-center justify-center shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/40 to-transparent"></div>
                  <Zap className="w-10 h-10 text-[#6B5B59] relative z-10" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F1EBE5] border border-[#E3D7CF] rounded-full">
                  <Sparkles className="w-4 h-4 text-[#6B5B59]" />
                  <span className="text-sm font-medium text-[#6B5B59]">Available</span>
                </div>
              </div>
              <CardTitle className="text-3xl text-gray-900 mb-2">Aluminum</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Complete lifecycle assessment for aluminum production and recycling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#6B5B59] mt-2" />
                  <p className="flex-1">Mining and ore extraction analysis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#6B5B59] mt-2" />
                  <p className="flex-1">Beneficiation and refining processes</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#6B5B59] mt-2" />
                  <p className="flex-1">Manufacturing and recycling workflows</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#6B5B59] mt-2" />
                  <p className="flex-1">AI-powered predictions and insights</p>
                </div>
              </div>
              <Button
                onClick={() => handleMetalSelect('aluminum')}
                className="w-full bg-linear-to-r from-[#6B5B59] to-[#5C4F4B] hover:from-[#5C4F4B] hover:to-[#4F4441] text-white font-semibold py-6 text-lg shadow-md group-hover:shadow-lg transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start with Aluminum
              </Button>
            </CardContent>
          </Card>
        </div>

{/* Copper  */}

        <div
          ref={(el) => (cardRefs.current[1] = el)}
          onMouseEnter={() => handleCardHover(1, true)}
          onMouseLeave={() => handleCardHover(1, false)}
          className="cursor-pointer"
        >
          <Card className="bg-white border-[#E8D0C3] hover:border-[#BA7967] hover:shadow-xl transition-all duration-300 h-full group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#EACFC1] via-[#BA7967] to-[#A86B5C] border-2 border-[#A86B5C] flex items-center justify-center shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/30 to-transparent"></div>
                  <Zap className="w-10 h-10 text-white relative z-10" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F5E8E2] border border-[#E6CEC1] rounded-full">
                  <Sparkles className="w-4 h-4 text-[#BA7967]" />
                  <span className="text-sm font-medium text-[#BA7967]">Available</span>
                </div>
              </div>
              <CardTitle className="text-3xl text-gray-900">Copper</CardTitle>
              <CardDescription className="text-gray-600 text-base">
                Complete lifecycle assessment for copper production and recycling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#BA7967] mt-2" />
                  <p className="flex-1">Mining and ore extraction analysis</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#BA7967] mt-2" />
                  <p className="flex-1">Smelting and refining processes</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#BA7967] mt-2" />
                  <p className="flex-1">Manufacturing and recycling workflows</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#BA7967] mt-2" />
                  <p className="flex-1">AI-powered predictions and insights</p>
                </div>
              </div>
              <Button
                onClick={() => handleMetalSelect('copper')}
                className="w-full bg-linear-to-r from-[#BA7967] to-[#A86B5C] hover:from-[#A86B5C] hover:to-[#915B4F] text-white font-semibold py-6 text-lg shadow-md group-hover:shadow-lg transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start with Copper
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-gray-500 text-sm">More metals will be available soon. Stay tuned!</p>
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
        className="w-full max-w-7xl rounded-4xl bg-white shadow-2xl border border-[#efe4d5] max-h-[90vh] overflow-y-auto"
      >
        <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center px-6 py-12">
          {stage === 'metal' ? renderMetalStage() : renderActionStage()}
        </div>
      </div>
    </div>
  );
}