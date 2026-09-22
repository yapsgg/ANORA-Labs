'use client';

import { useState } from 'react';
import { Panel } from '@xyflow/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  MoreHorizontal,
  Globe,
  GitBranchPlus,
  Lock,
  Link2,
  Loader2,
  Check,
  Command as CommandIcon,
  Store,
  StoreIcon,
} from 'lucide-react';
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog';
import { PublishToMarketplaceDialog } from '@/components/marketplace/publish-to-marketplace-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PublishPanelProps {
  flowId: Id<'flows'>;
}

export function PublishPanel({ flowId }: PublishPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [showMarketplaceDialog, setShowMarketplaceDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get public flow info
  const publicFlowInfo = useQuery(api.publicFlows.getPublicFlowInfo, { flowId });

  // Get user's projects for fork dialog
  const projects = useQuery(api.projects.list);

  // Marketplace listing check
  const marketplaceListing = useQuery(api.marketplace.getByFlow, { flowId });

  // Mutations
  const publishFlow = useMutation(api.publicFlows.publish);
  const unpublishFlow = useMutation(api.publicFlows.unpublish);
  const forkFlow = useMutation(api.publicFlows.fork);
  const unpublishMarketplace = useMutation(api.marketplace.unpublish);

  if (!publicFlowInfo) {
    return null;
  }

  const { isOwner, isPublished, publicFlow } = publicFlowInfo;

  const handlePublish = async () => {
    setIsProcessing(true);
    setOpen(false);
    try {
      await publishFlow({ flowId });
      toast.success('Flow published successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish flow');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsProcessing(true);
    setOpen(false);
    try {
      await unpublishFlow({ flowId });
      toast.success('Flow unpublished');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to unpublish flow');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/workflow/${flowId}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
    setOpen(false);
  };

  const handleForkClick = () => {
    setOpen(false);
    setShowForkDialog(true);
  };

  const handleShortcutsClick = () => {
    setOpen(false);
    setShowShortcutsDialog(true);
  };

  const handleMarketplaceClick = () => {
    setOpen(false);
    setShowMarketplaceDialog(true);
  };

  const handleUnpublishMarketplace = async () => {
    if (!marketplaceListing) return;
    setIsProcessing(true);
    setOpen(false);
    try {
      await unpublishMarketplace({ listingId: marketplaceListing._id });
      toast.success('Removed from marketplace');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove from marketplace');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFork = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await forkFlow({
        flowId,
        targetProjectId: selectedProject as Id<'projects'>,
      });
      toast.success('Flow forked successfully!');
      setShowForkDialog(false);
      router.push(`/workflow/${result.forkedFlowId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fork flow');
    } finally {
      setIsProcessing(false);
    }
  };

  // For non-owners viewing non-published flows, show nothing
  if (!isOwner && !isPublished) {
    return null;
  }

  return (
    <>
      <Panel position="top-right" className="!m-4 rounded-lg backdrop-blur-sm">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7 p-0 rounded-md", open && "bg-accent dark:hover:bg-accent")}  
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MoreHorizontal className="size-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search actions..." />
              <CommandList>
                <CommandEmpty>No actions found.</CommandEmpty>

                {isOwner ? (
                  <>
                    <CommandGroup heading="Visibility">
                      {isPublished ? (
                        <CommandItem onSelect={handleUnpublish}>
                          <Lock className="size-4" />
                          <span>Unpublish</span>
                        </CommandItem>
                      ) : (
                        <CommandItem onSelect={handlePublish}>
                          <Globe className="size-4" />
                          <span>Publish</span>
                        </CommandItem>
                      )}
                    </CommandGroup>

                    {isPublished && (
                      <>
                        <CommandSeparator />
                        <CommandGroup heading="Stats">
                          <CommandItem disabled>
                            <GitBranchPlus className="size-4" />
                            <span>{publicFlow?.forkCount ?? 0} Remixes</span>
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}

                    <CommandSeparator />
                    <CommandGroup heading="Marketplace">
                      {marketplaceListing ? (
                        <CommandItem onSelect={handleUnpublishMarketplace}>
                          <StoreIcon className="size-4" />
                          <span>Remove from Marketplace</span>
                        </CommandItem>
                      ) : (
                        <CommandItem onSelect={handleMarketplaceClick}>
                          <Store className="size-4" />
                          <span>List on Marketplace</span>
                        </CommandItem>
                      )}
                    </CommandGroup>

                    <CommandSeparator />
                    <CommandGroup heading="Share">
                      <CommandItem onSelect={handleCopyLink}>
                        <Link2 className="size-4 -rotate-45" />
                        <span>Copy link</span>
                      </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />
                    <CommandGroup heading="Help">
                      <CommandItem onSelect={handleShortcutsClick}>
                        <CommandIcon className="size-4" />
                        <span>Keyboard shortcuts</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                ) : (
                  <>
                    <CommandGroup heading="Actions">
                      <CommandItem onSelect={handleForkClick}>
                        <GitBranchPlus className="size-4" />
                        <span>Remix Flow</span>
                      </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />
                    <CommandGroup heading="Share">
                      <CommandItem onSelect={handleCopyLink}>
                        <Link2 className="size-4 -rotate-45" />
                        <span>Copy link</span>
                      </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />
                    <CommandGroup heading="Help">
                      <CommandItem onSelect={handleShortcutsClick}>
                        <CommandIcon className="size-4" />
                        <span>Keyboard shortcuts</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </Panel>

      {/* Fork Dialog */}
      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remix Flow</DialogTitle>
            <DialogDescription>
              Create a copy of this flow in your project. You can then modify it as you like.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Select destination project
            </label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForkDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFork}
              disabled={isProcessing || !selectedProject}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Remix Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />

      {/* Publish to Marketplace Dialog */}
      <PublishToMarketplaceDialog
        open={showMarketplaceDialog}
        onOpenChange={setShowMarketplaceDialog}
        flowId={flowId}
        flowName={publicFlowInfo.flow.name}
      />
    </>
  );
}
