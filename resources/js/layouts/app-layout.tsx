import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    breadcrumbAction?: ReactNode;
}

export default ({ children, breadcrumbs, breadcrumbAction, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} breadcrumbAction={breadcrumbAction} {...props}>
        {children}
    </AppLayoutTemplate>
);
