'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  /**
   * We replace 'any' with 'keyof typeof Icons'.
   * This ensures that we are looking up a property that actually exists 
   * in the Lucide library without breaking strict type rules.
   */
  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<LucideProps>;

  if (!IconComponent) {
    // OWASP A04: Insecure Design - Fallback ensures the UI doesn't crash 
    // if a Super Admin enters a typo in the database icon name.
    return <Icons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
};