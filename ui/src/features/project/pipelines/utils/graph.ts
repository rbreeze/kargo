import { graphlib } from 'dagre';

import { RepoSubscription, Stage } from '@ui/gen/v1alpha1/generated_pb';

import { AnyNodeType, ConnectorsType, NodeType, RepoNodeType } from '../types';

export const LINE_THICKNESS = 2;

export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 140;

export const WAREHOUSE_NODE_WIDTH = 185;
export const WAREHOUSE_NODE_HEIGHT = 110;

export const initNodeArray = (s: Stage) =>
  [
    {
      data: s,
      type: NodeType.STAGE,
      color: '#000'
    }
  ] as AnyNodeType[];

export const getNodeType = (sub: RepoSubscription) =>
  sub.chart ? NodeType.REPO_CHART : sub.image ? NodeType.REPO_IMAGE : NodeType.REPO_GIT;

export const newSubscriptionNode = (
  sub: RepoSubscription,
  warehouseName: string
): RepoNodeType => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: sub.chart || sub.image || sub.git || ({} as any),
  // stageNames: [stage?.metadata?.name || ''],
  warehouseName,
  type: getNodeType(sub)
});

export const nodeStubFor = (type: NodeType) => {
  const isStage = type === NodeType.STAGE;
  return {
    width: isStage ? NODE_WIDTH : WAREHOUSE_NODE_WIDTH,
    height: isStage ? NODE_HEIGHT : WAREHOUSE_NODE_HEIGHT
  };
};

export const getConnectors = (g: graphlib.Graph) => {
  const groups: { [key: string]: { [key: string]: ConnectorsType[][] } } = {};
  g.edges().map((item) => {
    const edge = g.edge(item);
    const points = edge.points;

    const parts = item.name?.split(' ') || [];
    const from = parts[0] || '';
    const to = parts[1] || '';

    const lines = new Array<ConnectorsType>();
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const x1 = start.x;
      const y1 = start.y;
      const x2 = end.x;
      const y2 = end.y;

      const width = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) + 2;
      // center
      const cx = (x1 + x2) / 2 - width / 2;
      const cy = (y1 + y2) / 2 - LINE_THICKNESS / 2;

      const angle = Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI);
      lines.push({ x: cx, y: cy, width, angle, color: edge['color'] });
    }

    const fromGr = groups[from] || {};
    groups[from] = { ...fromGr, [to]: [...(fromGr[to] || []), lines] };
  });

  for (const fromKey in groups) {
    if (Object.keys(groups[fromKey] || {}).length === 1) {
      for (const group of Object.values(groups[fromKey])) {
        group.forEach((lines) => {
          lines.forEach((line) => {
            line.angle = 0;
          });
        });
      }
    }
  }
  return Object.values(groups).flatMap((group) =>
    Object.values(group).flatMap((item) => Object.values(item))
  );
};
