// Type-aware icon picker for schema browsers, field dropdowns, detail labels.
// Returns the lucide icon component to render next to the column name.
//
// Consumers: QueryBuilder column list, AI-Hub table picker, Pivot row/col
// pickers, Filter-pane target picker, DetailWidget key labels.
//
// The order of checks matters — more specific wins over more generic
// (PK > FK > geographic > temporal > boolean > semantic textual > numeric).

import type { LucideIcon } from "lucide-react";
import {
  Key, Link2,
  MapPin,
  Calendar, Clock,
  ToggleLeft,
  Mail,
  Link as LinkIcon, Image as ImageIcon,
  DollarSign, Percent,
  Hash,
  Type as TypeIcon,
  FileText,
  Gauge as GaugeIcon,
  Tag,
  Timer,
} from "lucide-react";
import type { ColumnSchema, TableSchema } from "./types";
import {
  isPK, isFK,
  isLatitude, isLongitude, isCoordinate, isLocation,
  isTemporal,
  isBooleanCol,
  isEmail, isURL, isImageURL, isAvatarURL,
  isCurrency, isPercentage,
  isName, isTitle, isDescription,
  isQuantity, isScore, isDuration,
  isNumeric,
} from "./smart-defaults";

export function getColumnIcon(col: ColumnSchema, table?: TableSchema): LucideIcon {
  // Relational — always first (PK/FK status trumps semantic type).
  if (table && isPK(col, table)) return Key;
  if (table && isFK(col, table)) return Link2;

  // Geographic
  if (isLatitude(col) || isLongitude(col) || isCoordinate(col)) return MapPin;
  if (isLocation(col)) return MapPin;

  // Temporal
  if (isTemporal(col)) return Calendar;

  // Boolean
  if (isBooleanCol(col)) return ToggleLeft;

  // Web / contact
  if (isEmail(col))      return Mail;
  if (isImageURL(col) || isAvatarURL(col)) return ImageIcon;
  if (isURL(col))        return LinkIcon;

  // Finance
  if (isCurrency(col))   return DollarSign;
  if (isPercentage(col)) return Percent;

  // Textual roles
  if (isName(col))        return Tag;
  if (isTitle(col))       return Tag;
  if (isDescription(col)) return FileText;

  // Numeric roles
  if (isDuration(col))    return Timer;
  if (isScore(col))       return GaugeIcon;
  if (isQuantity(col))    return Hash;

  // Structural fallback
  if (isNumeric(col)) return Hash;
  return TypeIcon;
}

/** Short text label describing the icon — for aria-label / tooltip. */
export function getColumnIconLabel(col: ColumnSchema, table?: TableSchema): string {
  if (table && isPK(col, table)) return "Primary key";
  if (table && isFK(col, table)) return "Foreign key";
  if (isLatitude(col))   return "Latitude";
  if (isLongitude(col))  return "Longitude";
  if (isLocation(col))   return "Location";
  if (isTemporal(col))   return "Date/Time";
  if (isBooleanCol(col)) return "Boolean";
  if (isEmail(col))      return "Email";
  if (isImageURL(col))   return "Image URL";
  if (isURL(col))        return "URL";
  if (isCurrency(col))   return "Currency";
  if (isPercentage(col)) return "Percentage";
  if (isName(col))       return "Name";
  if (isTitle(col))      return "Title";
  if (isDescription(col)) return "Description";
  if (isDuration(col))   return "Duration";
  if (isScore(col))      return "Score";
  if (isQuantity(col))   return "Quantity";
  if (isNumeric(col))    return "Number";
  return "Text";
}
