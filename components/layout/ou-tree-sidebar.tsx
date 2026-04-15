'use client';

import { useState } from 'react';
import { ADOU } from '@/lib/types/config';
import { OUTreeNode } from '@/components/ad/ou-tree-node';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OUTreeSidebarProps {
  ous: ADOU[];
  selectedOuDN?: string;
  onSelectOU: (ouDN: string, ou: ADOU) => void;
  onCreateOU: (parentOuDN?: string) => void;
  onDeleteOU: (ouDN: string, ouName: string) => void;
  isLoading?: boolean;
}

type OUTreeNodeData = ADOU & {
  children: OUTreeNodeData[];
};

const getParentDN = (dn: string) => {
  const parts = dn.match(/(?:\\.|[^,])+/g);
  if (!parts || parts.length <= 1) {
    return '';
  }
  return parts.slice(1).map((part) => part.trim()).join(',');
};

const buildTree = (ous: ADOU[]): OUTreeNodeData[] => {
  const nodeMap = new Map<string, OUTreeNodeData>();

  ous.forEach((ou) => {
    nodeMap.set(ou.dn, { ...ou, children: [] });
  });

  const roots: OUTreeNodeData[] = [];

  nodeMap.forEach((node) => {
    const parentDN = getParentDN(node.dn);
    if (parentDN && nodeMap.has(parentDN)) {
      nodeMap.get(parentDN)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: OUTreeNodeData[]) => {
    nodes.sort((a, b) => a.ou.localeCompare(b.ou));
    nodes.forEach((node) => sortTree(node.children));
  };

  sortTree(roots);
  return roots;
};

export function OUTreeSidebar({
  ous,
  selectedOuDN,
  onSelectOU,
  onCreateOU,
  onDeleteOU,
  isLoading = false,
}: OUTreeSidebarProps) {
  const [expandedOUs, setExpandedOUs] = useState<Set<string>>(new Set());

  const handleToggleExpand = (ouDN: string) => {
    const nextExpanded = new Set(expandedOUs);
    if (nextExpanded.has(ouDN)) {
      nextExpanded.delete(ouDN);
    } else {
      nextExpanded.add(ouDN);
    }
    setExpandedOUs(nextExpanded);
  };

  const tree = buildTree(ous);

  const renderNode = (node: OUTreeNodeData, level = 0) => (
    <div key={node.dn}>
      <OUTreeNode
        ou={node}
        selected={selectedOuDN === node.dn}
        onSelect={onSelectOU}
        level={level}
        expanded={expandedOUs.has(node.dn)}
        onToggleExpand={handleToggleExpand}
        onCreateChild={onCreateOU}
        onDelete={onDeleteOU}
        childOus={node.children}
        isLoading={isLoading}
      />

      {expandedOUs.has(node.dn) && node.children.length > 0 && (
        <div className="space-y-1">
          {node.children.map((child) => renderNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="overflow-y-auto max-h-[calc(100vh-120px)] flex items-center justify-center h-full text-sm text-muted-foreground">
        Loading OUs...
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-120px)] space-y-2">
      <div
        onClick={() => onSelectOU('ROOT', { dn: 'ROOT', ou: 'All Objects', objectClass: [], cn: 'All Objects' })}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer mb-2',
          'hover:bg-muted text-foreground',
          selectedOuDN === 'ROOT' && 'bg-primary text-primary-foreground hover:bg-primary'
        )}
      >
        <LayoutGrid className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">All Objects</span>
      </div>

      <div className="h-px bg-border my-2 mx-1" />

      {tree.length === 0 ? (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-4 text-center">
          No Organizational Units found
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map((node) => renderNode(node, 0))}
        </div>
      )}
    </div>
  );
}
