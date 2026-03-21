import React from 'react';
import HelpClient from './HelpClient';

export const revalidate = 3600; // Revalidate every hour

export default function HelpPage() {
    return <HelpClient />;
}
