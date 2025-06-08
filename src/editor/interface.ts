import type { CSSProperties, PropsWithChildren } from "react";

export interface CommonComponentProps extends PropsWithChildren {
  id: number;
  name: string;
  styles?: CSSProperties;
  isSelected?: boolean;
  [key: string]: any;
}
