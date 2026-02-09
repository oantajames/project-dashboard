"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Stepper } from "./Stepper";
import { ProjectData, ProjectMode } from "./types";
import { StepMode } from "./steps/StepMode";
import { StepIntent } from "./steps/StepIntent";
import { StepOutcome } from "./steps/StepOutcome";
import { StepOwnership } from "./steps/StepOwnership";
import { StepStructure } from "./steps/StepStructure";
import { StepReview } from "./steps/StepReview";
import { StepQuickCreate } from "./steps/StepQuickCreate";
import { StepIntakeInfo } from "./steps/StepIntakeInfo";
import { StepIntakeScopeContent } from "./steps/StepIntakeScopeContent";
import { StepIntakeBrandingInspiration } from "./steps/StepIntakeBrandingInspiration";
import { StepIntakeFeaturesTech } from "./steps/StepIntakeFeaturesTech";
import { StepIntakeBudgetAccess } from "./steps/StepIntakeBudgetAccess";
import { StepIntakeReview } from "./steps/StepIntakeReview";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { createProject } from "@/lib/firebase/services/projects";
import { useAuth } from "@/contexts/AuthContext";
import type { CreateProjectData } from "@/lib/types";

const QUICK_CREATE_STEP = 100;

interface ProjectWizardProps {
  onClose: () => void;
  onCreate?: () => void;
}

export function ProjectWizard({ onClose, onCreate }: ProjectWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [isQuickCreateExpanded, setIsQuickCreateExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [data, setData] = useState<ProjectData>({
    mode: undefined,
    successType: 'undefined',
    deliverables: [],
    metrics: [],
    description: '',
    deadlineType: 'none',
    contributorIds: [],
    stakeholderIds: [],
    addStarterTasks: false,
  });

  const handleCreateProject = async (projectData: CreateProjectData) => {
    if (!user) {
      toast.error("You must be logged in to create a project");
      return;
    }

    setIsCreating(true);
    try {
      await createProject(projectData, user.id);
      toast.success("Project created successfully");
      onCreate?.();
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  /** Build CreateProjectData from the intake wizard data and submit */
  const handleCreateFromIntake = async () => {
    if (!data.intakeProjectName?.trim() || !data.intakeClientId) {
      toast.error("Project name and client are required");
      return;
    }

    const projectData: CreateProjectData = {
      name: data.intakeProjectName.trim(),
      clientId: data.intakeClientId,
      status: "planned",
      priority: "medium",
      startDate: data.intake?.budgetTimeline?.startDate ? new Date(data.intake.budgetTimeline.startDate) : undefined,
      endDate: data.intake?.projectInfo?.deadline ? new Date(data.intake.projectInfo.deadline) : undefined,
      tags: data.intake?.projectTypes?.types ?? [],
      picUserIds: user ? [user.id] : [],
      supportUserIds: [],
      typeLabel: (data.intake?.projectTypes?.types ?? []).join(", ") || undefined,
      intake: data.intake,
    };

    await handleCreateProject(projectData);
  };

  // Determine which wizard path we're on
  const isIntakePath = data.mode === 'guided';

  // Step 0 is Mode Selection. It's separate from the numbered stepper.
  //
  // Guided (Intake) path:
  //   0: Mode
  //   1: Info + Types (Sections 0 & 1)
  //   2: Scope + Content (Sections 2 & 3)
  //   3: Branding + Inspiration (Sections 4 & 5)
  //   4: Features + Technical (Sections 6 & 7)
  //   5: Access + Budget + Notes (Sections 8, 9 & 10)
  //   6: Review
  //
  // Legacy guided path steps are preserved but the "guided" mode now uses intake.

  const updateData = (updates: Partial<ProjectData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const totalSteps = isIntakePath ? 6 : 5;

  const nextStep = () => {
    if (step === 0 && data.mode === 'quick') {
      setStep(QUICK_CREATE_STEP);
      return;
    }
    
    setStep(prev => {
        const next = prev + 1;
        setMaxStepReached(m => Math.max(m, next));
        return next;
    });
  };

  const prevStep = () => {
    if (step === 1) {
      // Go back to mode selection
      setStep(0);
      return;
    }
    setStep(prev => prev - 1);
  };

  const jumpToStep = (s: number) => {
      setStep(s + 1);
  }

  const handleEditStepFromReview = (targetStep: number) => {
    setStep(targetStep);
  };

  const isNextDisabled = () => {
      if (isIntakePath) {
        // Step 1: Require project name and client
        if (step === 1 && (!data.intakeProjectName?.trim() || !data.intakeClientId)) return true;
        return false;
      }
      if (step === 3 && !data.ownerId) return true;
      return false;
  }

  const handleClose = () => {
    onClose();
  };

  // Steps config for the stepper sidebar
  const intakeSteps = [
    "Info & Type",
    "Scope & Content",
    "Branding & Inspiration",
    "Features & Technical",
    "Access & Budget",
    "Review & Create",
  ];

  const legacySteps = [
    "Project intent",
    "Outcome & success",
    "Ownership",
    "Work structure",
    "Review & create"
  ];

  const steps = isIntakePath ? intakeSteps : legacySteps;

  const intakeStepTitles: Record<number, string> = {
    1: "Project info & type",
    2: "Scope & content details",
    3: "Branding & inspiration",
    4: "Features & technical details",
    5: "Access, budget & notes",
    6: "Review your project brief",
  };

  const legacyStepTitles: Record<number, string> = {
    1: "What is this project mainly about?",
    2: "How do you define success?",
    3: "Who is responsible for this project?",
    4: "How should this project be structured?",
    5: "Review project setup",
  };

  const stepTitles = isIntakePath ? intakeStepTitles : legacyStepTitles;
  const lastStep = isIntakePath ? 6 : 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
            opacity: 1, 
            scale: 1,
            height: step === QUICK_CREATE_STEP 
                ? (isQuickCreateExpanded ? "85vh" : "auto") 
                : (isIntakePath && step >= 1 ? "85vh" : "auto")
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
            "flex w-full max-w-[900px] overflow-hidden rounded-[24px] bg-background shadow-2xl"
        )}
      >
        {step === 0 ? (
             <StepMode 
                selected={data.mode} 
                onSelect={(m) => updateData({ mode: m })} 
                onContinue={nextStep}
                onCancel={handleClose}
                onClose={handleClose}
             />
        ) : step === QUICK_CREATE_STEP ? (
            <StepQuickCreate
                onClose={handleClose}
                onCreate={handleCreateProject}
                onExpandChange={setIsQuickCreateExpanded}
            />
        ) : (
            <>
                {/* Left Sidebar (Stepper) */}
                <div className="hidden w-64 border-r border-border bg-background px-6 py-7 md:flex md:flex-col md:gap-7 shrink-0">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {isIntakePath ? "Project Brief" : "New Project"}
                    </p>
                  </div>
                  <Stepper 
                    currentStep={step - 1} 
                    steps={steps} 
                    onStepClick={jumpToStep}
                    maxStepReached={maxStepReached - 1}
                  />
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col min-w-0">
                    {/* Header: Title + Close button */}
                    <div className="flex items-start justify-between px-8 pt-6 pb-4 shrink-0">
                        <div className="pr-6">
                          {stepTitles[step] && (
                            <h2 className="text-lg font-semibold tracking-tight">
                              {stepTitles[step]}
                            </h2>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={handleClose}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-8 pb-8 pt-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {isIntakePath ? (
                                    <>
                                        {step === 1 && <StepIntakeInfo data={data} updateData={updateData} />}
                                        {step === 2 && <StepIntakeScopeContent data={data} updateData={updateData} />}
                                        {step === 3 && <StepIntakeBrandingInspiration data={data} updateData={updateData} />}
                                        {step === 4 && <StepIntakeFeaturesTech data={data} updateData={updateData} />}
                                        {step === 5 && <StepIntakeBudgetAccess data={data} updateData={updateData} />}
                                        {step === 6 && <StepIntakeReview data={data} onEditStep={handleEditStepFromReview} />}
                                    </>
                                ) : (
                                    <>
                                        {step === 1 && <StepIntent selected={data.intent} onSelect={(i) => updateData({ intent: i })} />}
                                        {step === 2 && <StepOutcome data={data} updateData={updateData} />}
                                        {step === 3 && <StepOwnership data={data} updateData={updateData} />}
                                        {step === 4 && <StepStructure data={data} updateData={updateData} />}
                                        {step === 5 && <StepReview data={data} onEditStep={handleEditStepFromReview} />}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between bg-background p-6 shrink-0">
                        <div>
                            <Button variant="outline" onClick={prevStep}>
                                <CaretLeft className=" h-4 w-4" />
                                Back
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            {step === lastStep ? (
                                <>
                                    <Button variant="outline">Save as template</Button>
                                    <Button
                                      disabled={isCreating}
                                      onClick={isIntakePath ? handleCreateFromIntake : () => {
                                        onCreate?.();
                                        toast.success("Project created successfully");
                                        onClose();
                                      }}
                                    >
                                      {isCreating ? "Creating..." : "Create project"}
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    onClick={nextStep} 
                                    disabled={isNextDisabled()}
                                >
                                    Next
                                    <CaretRight className=" h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </>
        )}
      </motion.div>
    </div>
  );
}
