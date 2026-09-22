// ─── Workflow Settings ──────────────────────────────────────────────────────
// Display-name mappings for toolbar selectors (adapted from canvas settings).

export type SettingsOption = {
  id: string;
  title: string;
  description: string;
  value: string | number;
};

// ---- Interactive placeholders -----------------------------------------------
export const DEFAULT_TEXT_NODE_PLACEHOLDER = [
  'Try "A ceremonial hymn sung to honor Flora at the first bloom of spring"',
  'Try "A secret diary entry of Faunus during the midsummer rites in the forest"',
  'Try "A love letter penned by a mortal to Venus under a rose-lit moon"',
  'Try "The opening chant of priestesses tending Venus\'s temple gardens"',
  'Try "A prophecy inscribed on Flora\'s shrine predicting the summer\'s bounty"',
  'Try "A fable told by Faunus to woodland creatures beneath ancient oaks"',
  'Try "The soliloquy of a sculptor unveiling Venus\'s marble statue"',
  'Try "A traveler\'s journal describing a hidden grove sacred to Flora"',
  'Try "An ancient recipe for a honey-mead blessed by Ceres and Venus"',
  'Try "Faunus\'s playful banter with a satyr beside a moonlit spring"',
  'Try "A villager\'s plea to Venus for mercy in matters of the heart"',
  'Try "The first stanza of a poem celebrating Flora\'s festival of petals"',
];

export const DEFAULT_IMAGE_NODE_PLACEHOLDER = [
  'Try "Spot the hidden symbol and explain its significance"',
  'Try "Transform this photo into a surreal dreamscape description"',
  'Try "List three hypothetical backstories for the main subject"',
  'Try "Describe how this scene would look in winter versus summer"',
  'Try "Reinterpret the lighting as if it were a film noir poster"',
  'Try "Identify the most unusual texture and explain why it stands out"',
  'Try "Imagine this image as a comic book panel—write the caption"',
  'Try "What story could be told by the shadows here?"',
  'Try "Map out a color palette based on the dominant hues"',
  'Try "Describe this scene from the perspective of an animal observer"',
  'Try "Suggest five alternate eras this photo could have been taken in"',
  'Try "Create a poetic haiku inspired by this image"',
];

export const DEFAULT_VIDEO_NODE_PLACEHOLDER = [
  'Try "A looping hyperlapse of blooming flowers in a glass terrarium"',
  'Try "A first-person POV walk through a bioluminescent forest"',
  'Try "A seamless transition montage from dawn to dusk in one shot"',
  'Try "A bullet-time spin around a dancer mid-leap"',
  'Try "A close-up slow-mo of ink swirling in water to form words"',
  'Try "A drone shot descending into an active volcano crater"',
  'Try "A cyclical animation of a city skyline rebuilding itself"',
  'Try "A tracking shot through a corridor of shifting mirrors"',
  'Try "A morphing sequence of an egg hatching into a mythical creature"',
  'Try "A loop of sheets of paper flipping to reveal different worlds"',
  'Try "An overhead view of dancers forming geometric shapes on a floor"',
  'Try "A time-warped sequence of a painting being created stroke by stroke"',
];

export const IMAGE_TO_IMAGE_PLACEHOLDERS = [
  'Try "Merge the style of the first image with the content of the second image"',
  'Try "Swap the backgrounds between these two photos seamlessly"',
  'Try "Use image A\'s color palette to recolor image B"',
  'Try "Blend these images into a single cohesive fantasy scene"',
  'Try "Replace the sky in image 1 with the sky from image 2"',
  'Try "Create a panorama by stitching these images together"',
  'Try "Extract the texture from image A and apply it to image B"',
  'Try "Generate a hybrid portrait combining features from both images"',
  'Try "Compare these two images and highlight their main differences"',
  'Try "Use image 2 as a style reference to restyle image 1"',
  'Try "Overlay image A on image B with realistic lighting"',
  'Try "Expand the scene in image 1 to include elements from image 2"',
];

// ─── Ratio Options ──────────────────────────────────────────────────────────

export const RATIO_OPTIONS: SettingsOption[] = [
  { id: '1:1', title: 'Square', description: 'Balanced square frame for social-media grids.', value: '1:1' },
  { id: '4:3', title: 'Classic Photo', description: 'Classic photo ratio for Facebook posts.', value: '4:3' },
  { id: '3:4', title: 'Portrait Photo', description: 'Tall portrait format for Pinterest pins.', value: '3:4' },
  { id: '3:2', title: 'Standard Photo', description: 'Traditional 35mm photo format.', value: '3:2' },
  { id: '2:3', title: 'Tall Portrait', description: 'Tall portrait format for prints.', value: '2:3' },
  { id: '5:4', title: 'Large Print', description: 'Classic large-format print ratio.', value: '5:4' },
  { id: '4:5', title: 'Instagram Portrait', description: 'Instagram portrait post ratio.', value: '4:5' },
  { id: '16:9', title: 'Widescreen', description: 'Standard widescreen format ideal for YouTube uploads.', value: '16:9' },
  { id: '9:16', title: 'Vertical Video', description: 'Vertical full-screen for Reels, TikTok, Shorts.', value: '9:16' },
  { id: '21:9', title: 'Cinematic Ultra-Wide', description: 'Extra-wide for dramatic, movie-style visuals.', value: '21:9' },
  { id: '9:21', title: 'Ultra-Tall', description: 'Extra-tall vertical for dramatic compositions.', value: '9:21' },
  { id: '1:4', title: 'Narrow Vertical', description: 'Very tall, narrow vertical strip.', value: '1:4' },
  { id: '4:1', title: 'Narrow Horizontal', description: 'Very wide, narrow horizontal strip.', value: '4:1' },
  { id: '1:8', title: 'Extreme Vertical', description: 'Ultra-narrow vertical strip.', value: '1:8' },
  { id: '8:1', title: 'Extreme Horizontal', description: 'Ultra-narrow horizontal strip.', value: '8:1' },
];

// ─── Duration Options ───────────────────────────────────────────────────────

export const DURATION_OPTIONS: SettingsOption[] = [
  { id: '4', title: 'TikTok virus video', description: 'TikTok virus video', value: 4 },
  { id: '5', title: 'TikTok viral shorts', description: 'TikTok viral shorts', value: 5 },
  { id: '6', title: 'YouTube shorts', description: 'YouTube shorts', value: 6 },
  { id: '7', title: 'Instagram reels', description: 'Instagram reels', value: 7 },
  { id: '8', title: 'Something viral...', description: 'Something viral...', value: 8 },
  { id: '10', title: 'Instagram long reels', description: 'Instagram long reels', value: 10 },
];

// ─── Resolution Options ─────────────────────────────────────────────────────

export const RESOLUTION_OPTIONS: SettingsOption[] = [
  { id: '480p', title: 'SD (480p)', description: 'Standard definition — small file, fast generation.', value: '480p' },
  { id: '540p', title: 'qHD (540p)', description: 'Quarter-HD — balanced quality and speed.', value: '540p' },
  { id: '720p', title: 'HD (720p)', description: 'Great for most social platforms.', value: '720p' },
  { id: '1080p', title: 'Full HD (1080p)', description: 'Crisp detail for YouTube and large screens.', value: '1080p' },
  { id: '4k', title: '4K Ultra HD', description: 'Maximum quality, larger file size.', value: '4k' },
];

// ─── Image Size Options ─────────────────────────────────────────────────────

export const IMAGE_SIZE_OPTIONS: SettingsOption[] = [
  { id: '1024x1024', title: 'Popular square', description: 'Popular square', value: '1024x1024' },
  { id: '256x256', title: 'Popular tiny square', description: 'Popular tiny square', value: '256x256' },
  { id: '512x512', title: 'Popular small square', description: 'Popular small square', value: '512x512' },
  { id: '2752x1536', title: 'Popular landscape', description: 'Popular landscape', value: '2752x1536' },
  { id: '1792x1024', title: 'Popular landscape', description: 'Popular landscape', value: '1792x1024' },
  { id: '1024x1792', title: 'Popular portrait', description: 'Popular portrait', value: '1024x1792' },
  { id: '1536x1024', title: 'Popular small landscape', description: 'Popular small landscape', value: '1536x1024' },
  { id: '1024x1536', title: 'Popular small portrait', description: 'Popular small portrait', value: '1024x1536' },
  { id: '1080x1080', title: 'Instagram post (square)', description: 'Instagram post (square)', value: '1080x1080' },
  { id: '1080x1350', title: 'Instagram post (portrait)', description: 'Instagram post (portrait)', value: '1080x1350' },
  { id: '1080x1920', title: 'Instagram story', description: 'Instagram story', value: '1080x1920' },
  { id: '1440x1440', title: 'Instagram ad', description: 'Instagram ad', value: '1440x1440' },
  { id: '1200x630', title: 'Facebook post', description: 'Facebook post', value: '1200x630' },
  { id: '851x315', title: 'Facebook cover photo', description: 'Facebook cover photo', value: '851x315' },
  { id: '1920x1005', title: 'Facebook event cover', description: 'Facebook event cover', value: '1920x1005' },
  { id: '1200x675', title: 'X post', description: 'X post', value: '1200x675' },
  { id: '1500x500', title: 'X banner', description: 'X banner', value: '1500x500' },
  { id: '1080x1080', title: 'LinkedIn post (square)', description: 'LinkedIn post (square)', value: '1080x1080' },
  { id: '1200x626', title: 'LinkedIn post (landscape)', description: 'LinkedIn post (landscape)', value: '1200x626' },
  { id: '1584x396', title: 'LinkedIn profile banner', description: 'LinkedIn profile banner', value: '1584x396' },
  { id: '1920x1080', title: 'LinkedIn article banner', description: 'LinkedIn article banner', value: '1920x1080' },
  { id: '1280x720', title: 'YouTube thumbnail', description: 'YouTube thumbnail', value: '1280x720' },
  { id: '2560x1440', title: 'YouTube banner', description: 'YouTube banner', value: '2560x1440' },
  { id: '1000x1500', title: 'Pinterest ad', description: 'Pinterest ad', value: '1000x1500' },
  { id: '2100x1500', title: 'Card (landscape)', description: 'Card (landscape)', value: '2100x1500' },
  { id: '1500x2100', title: 'Card (portrait)', description: 'Card (portrait)', value: '1500x2100' },
  { id: '2550x3300', title: 'Print (US Letter)', description: 'Print (US Letter)', value: '2550x3300' },
  { id: '2700x3600', title: 'Poster', description: 'Poster', value: '2700x3600' },
  { id: '2400x1200', title: 'Banner (Standard)', description: 'Banner (Standard)', value: '2400x1200' },
  { id: '1920x1080', title: 'Zoom background', description: 'Zoom background', value: '1920x1080' },
];

// ─── Dynamic Size Classification ────────────────────────────────────────────

function classifyImageSize(sizeId: string): { title: string; description: string } {
  const parts = sizeId.split('x');
  if (parts.length !== 2) {
    return { title: 'Custom size', description: sizeId };
  }

  const [widthStr, heightStr] = parts;
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  if (isNaN(width) || isNaN(height)) {
    return { title: 'Custom size', description: sizeId };
  }

  const totalPixels = width * height;
  const aspectRatio = width / height;
  const isSquare = Math.abs(aspectRatio - 1) < 0.1;
  const isLandscape = aspectRatio > 1.2;
  const isPortrait = aspectRatio < 0.8;

  // Determine orientation
  let orientation = 'Custom';
  if (isSquare) orientation = 'Square';
  else if (isLandscape) orientation = 'Landscape';
  else if (isPortrait) orientation = 'Portrait';

  // Determine size category based on total pixels
  let sizeCategory = '';
  if (totalPixels < 300000) { // < 300K pixels (e.g., 512x512 = 262K)
    sizeCategory = 'Small';
  } else if (totalPixels < 1000000) { // < 1M pixels (e.g., 1024x1024 = 1M)
    sizeCategory = 'Medium';
  } else if (totalPixels < 2500000) { // < 2.5M pixels (e.g., 1920x1080 = 2M)
    sizeCategory = 'Large';
  } else if (totalPixels < 5000000) { // < 5M pixels
    sizeCategory = 'Extra Large';
  } else {
    sizeCategory = 'Ultra High';
  }

  // Special cases for common social media sizes
  if (width === 1080 && height === 1080) {
    return { title: 'Social square', description: 'Perfect for Instagram posts' };
  }
  if (width === 1080 && height === 1920) {
    return { title: 'Story format', description: 'Instagram/TikTok stories' };
  }
  if (width === 1920 && height === 1080) {
    return { title: 'HD landscape', description: 'YouTube thumbnails & backgrounds' };
  }
  if (width === 1280 && height === 720) {
    return { title: 'HD standard', description: 'YouTube thumbnails' };
  }

  return {
    title: `${sizeCategory} ${orientation.toLowerCase()}`,
    description: `${width}×${height} (${Math.round(totalPixels / 1000000 * 10) / 10}MP)`
  };
}

// ─── Lookup helpers ─────────────────────────────────────────────────────────

export function getImageSizeTitle(sizeId: string): string {
  // Check if it's a ratio string (e.g. "16:9")
  const ratioOption = RATIO_OPTIONS.find((o) => o.id === sizeId);
  if (ratioOption) {
    return `${ratioOption.title} (${sizeId})`;
  }
  // If it looks like a ratio but not in RATIO_OPTIONS, display as-is
  if (/^\d+:\d+$/.test(sizeId)) {
    return sizeId;
  }

  const option = IMAGE_SIZE_OPTIONS.find((o) => o.id === sizeId);
  if (option) {
    return `${option.title}`;
  }

  // Fallback to dynamic classification for unknown sizes
  const classified = classifyImageSize(sizeId);
  return `${classified.title}`;
}

export function getRatioTitle(ratioId: string): string {
  const option = RATIO_OPTIONS.find((o) => o.id === ratioId);
  return option ? `${option.title} (${ratioId})` : ratioId;
}

export function getDurationTitle(durationId: string | number): string {
  const id = String(durationId);
  const option = DURATION_OPTIONS.find((o) => o.id === id);
  return option ? `${option.title} (${id}s)` : `${id}s`;
}

export function getResolutionTitle(resolutionId: string): string {
  const option = RESOLUTION_OPTIONS.find((o) => o.id === resolutionId);
  return option ? `${option.title} (${resolutionId})` : resolutionId;
}
