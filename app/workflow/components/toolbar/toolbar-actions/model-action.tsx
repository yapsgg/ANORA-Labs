'use client';

import { useMemo, useState } from 'react';
import { Bot, Image, Video, Check, ChevronDown, Search, Sparkles, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TEXT_MODELS,
  IMAGE_MODELS,
  VIDEO_MODELS,
  groupByProvider,
  getBaseModelConfig,
  isAutoRouter,
  isFreeVariant,
  isNitroVariant,
  stripNitroSuffix,
  NITRO_SUFFIX,
  type UiModel,
} from '@/app/workflow/model-data';
import { cn } from '@/lib/utils';

type NodeType = 'text' | 'image' | 'video';

interface ModelActionProps {
  value: string;
  onChange: (model: string) => void;
  type: NodeType;
  /** Optional list of model IDs to filter to. If provided, only these models will be shown. */
  availableModelIds?: string[];
  /** When true, the node is in Auto-select mode (model picked by router/resolver). */
  auto?: boolean;
  /** Setter for the Auto-select toggle. Required for text/image to enable the toggle. */
  onAutoChange?: (auto: boolean) => void;
}

const typeIcons = { text: Bot, image: Image, video: Video };

const modelLists = {
  text: TEXT_MODELS,
  image: IMAGE_MODELS,
  video: VIDEO_MODELS,
};

type FilterTab = 'all' | 'free' | 'nitro';

const TAB_LABELS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'nitro', label: 'Nitro' },
];

/**
 * Strip the provider prefix the registry attaches to every model name
 * (e.g. "OpenAI: GPT-5.5" → "GPT-5.5"). Provider is already shown by the
 * parent sub-menu, so repeating it on every row is just noise.
 */
function displayName(name: string, provider: string): string {
  const prefix = `${provider}: `;
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

type TriggerDisplay = {
  label: string;
  icon: string | null;
  badge: 'nitro' | 'free' | null;
};

/** Trigger display: respect routing variants so the chip stays informative. */
function getTriggerDisplay(value: string): TriggerDisplay {
  const base = getBaseModelConfig(value);
  if (!base) return { label: value, icon: null, badge: null };
  const label = displayName(base.name, base.provider);
  if (isNitroVariant(value)) return { label, icon: base.icon, badge: 'nitro' };
  if (isFreeVariant(value)) return { label, icon: base.icon, badge: 'free' };
  return { label, icon: base.icon, badge: null };
}

export function ModelAction({
  value,
  onChange,
  type,
  availableModelIds,
  auto = false,
  onAutoChange,
}: ModelActionProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');

  // Routing tabs (Free/Nitro) are OpenRouter chat-completion features — text only.
  const showRoutingTabs = type === 'text';
  // Auto-select toggle is meaningful for text (delegates to openrouter/auto) and
  // image (lets the resolver pick a compatible model). Video stays manual.
  const showAutoToggle = (type === 'text' || type === 'image') && !!onAutoChange;
  const autoEnabled = showAutoToggle && auto;

  const FallbackIcon = typeIcons[type];
  const allModels = modelLists[type] as UiModel[];

  // Upstream-driven availability filter first (e.g. only vision-capable models).
  const constrained = useMemo(() => {
    if (!availableModelIds || availableModelIds.length === 0) return allModels;
    return allModels.filter((m) => availableModelIds.includes(m.id));
  }, [allModels, availableModelIds]);

  // `openrouter/auto` is controlled by the Auto toggle, never selectable here.
  // `:free` variants are isolated to the Free tab.
  const tabFiltered = useMemo(() => {
    const base = constrained.filter((m) => !isAutoRouter(m.id));
    if (!showRoutingTabs) return base.filter((m) => !isFreeVariant(m.id));
    switch (tab) {
      case 'free':
        return base.filter((m) => isFreeVariant(m.id));
      case 'nitro':
      case 'all':
      default:
        return base.filter((m) => !isFreeVariant(m.id));
    }
  }, [constrained, tab, showRoutingTabs]);

  const grouped = useMemo(() => groupByProvider(tabFiltered), [tabFiltered]);

  // The current explicit model selection — shown in the trigger and highlighted
  // even while Auto is on so the user knows what they'd fall back to.
  const currentBase = getBaseModelConfig(value);
  const currentProvider = currentBase?.provider;

  const providers = Object.entries(grouped).map(([provider, providerModels]) => ({
    name: provider,
    icon: providerModels[0]?.icon,
    models: providerModels,
    hasCurrentModel: provider === currentProvider,
  }));

  const isSearching = search.trim().length > 0;
  const filteredModels = useMemo(() => {
    if (!isSearching) return [];
    const searchLower = search.toLowerCase();
    return tabFiltered.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.provider.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower),
    );
  }, [tabFiltered, search, isSearching]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearch('');
      setTab('all');
    }
  };

  const handleSelect = (modelId: string) => {
    // Nitro tab applies `:nitro` to whichever base model the user picks.
    // Free entries are already suffixed in the registry, so pass-through.
    const resolved =
      showRoutingTabs && tab === 'nitro' && !isNitroVariant(modelId)
        ? `${stripNitroSuffix(modelId)}${NITRO_SUFFIX}`
        : modelId;
    onChange(resolved);
    setOpen(false);
    setSearch('');
  };

  const trigger = getTriggerDisplay(value);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          title="Select model"
        >
          {autoEnabled ? (
            <Sparkles className="size-3.5 text-primary hidden" />
          ) : trigger.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trigger.icon} alt="" className="size-4 rounded shrink-0" />
          ) : (
            <FallbackIcon className="size-3.5" />
          )}
          <span className="max-w-[100px] truncate">
            {autoEnabled ? 'Auto' : trigger.label}
          </span>
          {!autoEnabled && trigger.badge === 'nitro' && (
            <Zap className="size-3 text-amber-500" />
          )}
          {!autoEnabled && trigger.badge === 'free' && (
            <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px]">
              Free
            </Badge>
          )}
          <ChevronDown className={cn('size-3 opacity-50', open && 'rotate-180')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* Search input */}
        <div className="flex items-center gap-2 px-2 py-1.5 border-b">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={autoEnabled}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            autoFocus
          />
        </div>

        {showAutoToggle && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium">Auto select model</span>
            </div>
            <Switch
              size="sm"
              checked={autoEnabled}
              onCheckedChange={(checked) => onAutoChange?.(checked)}
              aria-label="Auto model selection"
            />
          </div>
        )}

        {showRoutingTabs && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-b">
            {TAB_LABELS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={autoEnabled}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 rounded-md px-2 py-1 text-xs transition-colors',
                  tab === t.id && !autoEnabled
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  autoEnabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {autoEnabled ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            {type === 'text'
              ? "OpenRouter's Auto Router picks the best text model for each prompt. Toggle off to pick manually."
              : "The best image model is picked based on what's connected upstream. Toggle off to pick manually."}
          </div>
        ) : isSearching ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Results</DropdownMenuLabel>
            {filteredModels.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No models found.
              </div>
            ) : (
              filteredModels.map((model) => (
                <ModelItem
                  key={model.id}
                  model={model}
                  selectedValue={value}
                  fallbackIcon={FallbackIcon}
                  nitroPreview={showRoutingTabs && tab === 'nitro'}
                  onSelect={handleSelect}
                />
              ))
            )}
          </DropdownMenuGroup>
        ) : tabFiltered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No models in this filter.
          </div>
        ) : (
          providers.map((provider) => (
            <DropdownMenuSub key={provider.name}>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                {provider.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.icon} alt="" className="size-4 rounded shrink-0" />
                ) : (
                  <FallbackIcon className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="font-medium flex-1 truncate">{provider.name}</span>
                {provider.hasCurrentModel && currentBase && (
                  <Badge
                    variant="secondary"
                    className="max-w-[100px] truncate text-[10px] py-0 h-5"
                  >
                    {displayName(currentBase.name, currentBase.provider)}
                  </Badge>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-72">
                {provider.models.map((model) => (
                  <ModelItem
                    key={model.id}
                    model={model}
                    selectedValue={value}
                    fallbackIcon={FallbackIcon}
                    nitroPreview={showRoutingTabs && tab === 'nitro'}
                    onSelect={handleSelect}
                    showPriceTime
                  />
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ModelItemProps {
  model: UiModel;
  selectedValue: string;
  fallbackIcon: React.ComponentType<{ className?: string }>;
  /** When true, the item represents the `:nitro` variant of `model.id`. */
  nitroPreview: boolean;
  showPriceTime?: boolean;
  onSelect: (modelId: string) => void;
}

function ModelItem({
  model,
  selectedValue,
  fallbackIcon: FallbackIcon,
  nitroPreview,
  showPriceTime,
  onSelect,
}: ModelItemProps) {
  // The persisted ID the row resolves to when clicked.
  const resolvedId = nitroPreview && !isNitroVariant(model.id)
    ? `${stripNitroSuffix(model.id)}${NITRO_SUFFIX}`
    : model.id;
  const isSelected = resolvedId === selectedValue;

  const showFreeBadge = isFreeVariant(model.id);

  return (
    <DropdownMenuItem
      onClick={() => onSelect(model.id)}
      className="flex items-start gap-2 cursor-pointer"
    >
      {model.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={model.icon} alt="" className="size-4 rounded shrink-0 mt-0.5" />
      ) : (
        <FallbackIcon className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
      )}
      <div className="flex flex-col min-w-0 flex-1">
        {/* Row 1: name shares a line with the price chip (or provider/badges
            for flat search results) and the selected check. */}
        <div className="flex items-center gap-2">
          <span className="text-sm truncate min-w-0 flex-1">
            {displayName(model.name, model.provider)}
          </span>
          {showPriceTime ? (
            <span className="text-xs text-muted-foreground shrink-0">
              {nitroPreview ? 'Nitro' : model.priceLabel}
            </span>
          ) : (
            <>
              {nitroPreview && <Zap className="size-3 text-amber-500 shrink-0" />}
              {showFreeBadge && (
                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] shrink-0">
                  Free
                </Badge>
              )}
            </>
          )}
          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
        </div>
        {/* Row 2: description (provider sub-menu) or provider (search) gets
            the full width of the row. */}
        {showPriceTime
          ? model.description && (
              <span className="text-xs text-muted-foreground truncate">
                {model.description}
              </span>
            )
          : (
            <span className="text-xs text-muted-foreground truncate">{model.provider}</span>
          )}
      </div>
    </DropdownMenuItem>
  );
}
