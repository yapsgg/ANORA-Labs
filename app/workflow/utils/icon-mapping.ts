import {
  Ban, Type, Image, Play,
} from 'lucide-react';

export const iconMapping: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  Ban: Ban,
  Type: Type,
  Image: Image,
  Play: Play,
};
