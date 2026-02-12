/**
 * CorrelationMap.jsx - Biomarker Correlation Graph
 *
 * Force-directed graph visualization showing relationships between related biomarkers.
 * Each node represents a biomarker, colored by severity. Edges show correlations/causality.
 *
 * Props:
 * - nodes: [{id: string, label: string, severity: "CRITICAL"|"HIGH"|"LOW"|"NORMAL"}]
 * - edges: [{source: string, target: string, relationship: string}]
 * - title: string (optional, defaults to "Biomarker Correlations")
 */

import React, { useEffect, useRef, useState } from 'react';
import { Network, AlertTriangle } from 'lucide-react';

/**
 * Get color scheme based on severity
 */
function getSeverityColor(severity) {
  const colors = {
    CRITICAL: { node: '#DC2626', label: 'Critical' },
    HIGH: { node: '#EA580C', label: 'High' },
    LOW: { node: '#3B82F6', label: 'Low' },
    NORMAL: { node: '#10B981', label: 'Normal' },
  };

  return colors[severity] || colors.NORMAL;
}

/**
 * Simple force-directed layout simulation using Verlet integration
 */
function simulateForceLayout(nodes, edges, iterations = 50) {
  const nodeMap = {};
  const positions = {};
  const velocities = {};
  const forces = {};

  // Initialize positions randomly
  nodes.forEach((node) => {
    nodeMap[node.id] = node;
    positions[node.id] = {
      x: Math.random() * 300 - 150,
      y: Math.random() * 300 - 150,
    };
    velocities[node.id] = { x: 0, y: 0 };
    forces[node.id] = { x: 0, y: 0 };
  });

  // Run simulation iterations
  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    nodes.forEach((node) => {
      forces[node.id] = { x: 0, y: 0 };
    });

    // Repulsive forces between all nodes
    nodes.forEach((nodeA, idx) => {
      for (let i = idx + 1; i < nodes.length; i++) {
        const nodeB = nodes[i];
        const dx = positions[nodeB.id].x - positions[nodeA.id].x;
        const dy = positions[nodeB.id].y - positions[nodeA.id].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const repulsion = (150 / (dist * dist)) * 0.5;

        forces[nodeA.id].x -= (dx / dist) * repulsion;
        forces[nodeA.id].y -= (dy / dist) * repulsion;
        forces[nodeB.id].x += (dx / dist) * repulsion;
        forces[nodeB.id].y += (dy / dist) * repulsion;
      }
    });

    // Attractive forces for connected edges
    edges.forEach((edge) => {
      const dx = positions[edge.target].x - positions[edge.source].x;
      const dy = positions[edge.target].y - positions[edge.source].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 100;
      const attraction = ((dist - targetDist) * 0.1) / dist;

      forces[edge.source].x += (dx / dist) * attraction;
      forces[edge.source].y += (dy / dist) * attraction;
      forces[edge.target].x -= (dx / dist) * attraction;
      forces[edge.target].y -= (dy / dist) * attraction;
    });

    // Center gravity
    nodes.forEach((node) => {
      forces[node.id].x -= positions[node.id].x * 0.02;
      forces[node.id].y -= positions[node.id].y * 0.02;
    });

    // Update velocities and positions
    nodes.forEach((node) => {
      velocities[node.id].x = (velocities[node.id].x + forces[node.id].x) * 0.85;
      velocities[node.id].y = (velocities[node.id].y + forces[node.id].y) * 0.85;

      positions[node.id].x += velocities[node.id].x;
      positions[node.id].y += velocities[node.id].y;

      // Damping
      velocities[node.id].x *= 0.9;
      velocities[node.id].y *= 0.9;
    });
  }

  return positions;
}

export default function CorrelationMap({
  nodes = [],
  edges = [],
  title = 'Biomarker Correlations',
}) {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  const [positions, setPositions] = useState({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedEdges, setSelectedEdges] = useState(new Set());
  const svgRef = useRef(null);

  // Calculate layout on component mount
  useEffect(() => {
    const layout = simulateForceLayout(nodes, edges);
    setPositions(layout);
  }, [nodes, edges]);

  if (Object.keys(positions).length === 0) {
    return null;
  }

  // Calculate SVG bounds
  const padding = 60;
  const positions_arr = Object.values(positions);
  const minX = Math.min(...positions_arr.map((p) => p.x)) - padding;
  const maxX = Math.max(...positions_arr.map((p) => p.x)) + padding;
  const minY = Math.min(...positions_arr.map((p) => p.y)) - padding;
  const maxY = Math.max(...positions_arr.map((p) => p.y)) + padding;

  const width = Math.max(400, maxX - minX);
  const height = Math.max(300, maxY - minY);

  const scale = {
    x: (p) => p.x - minX,
    y: (p) => p.y - minY,
  };

  // Get unique severities for legend
  const severities = [...new Set(nodes.map((n) => n.severity))];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Network size={28} className="text-purple-600" />
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-sm text-gray-600">
            Visual map of how your biomarkers relate and influence each other
          </p>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 overflow-x-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="mx-auto"
          style={{ minWidth: '400px', minHeight: '300px' }}
        >
          {/* Edges (connections) */}
          {edges.map((edge, idx) => {
            const source = positions[edge.source];
            const target = positions[edge.target];

            if (!source || !target) return null;

            const isHovered = hoveredNode === edge.source || hoveredNode === edge.target;
            const isSelected = selectedEdges.has(idx);

            return (
              <g
                key={`edge-${idx}`}
                onMouseEnter={() => setSelectedEdges(new Set([idx]))}
                onMouseLeave={() => setSelectedEdges(new Set())}
                style={{ cursor: 'pointer' }}
              >
                {/* Edge line */}
                <line
                  x1={scale.x(source)}
                  y1={scale.y(source)}
                  x2={scale.x(target)}
                  y2={scale.y(target)}
                  stroke={isSelected ? '#7C3AED' : '#D1D5DB'}
                  strokeWidth={isSelected ? 3 : 2}
                  opacity={hoveredNode === null || isHovered || isSelected ? 1 : 0.3}
                  className="transition-all"
                />

                {/* Edge label */}
                {isSelected && (
                  <text
                    x={(scale.x(source) + scale.x(target)) / 2}
                    y={(scale.y(source) + scale.y(target)) / 2 - 8}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#7C3AED"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {edge.relationship}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes (biomarkers) */}
          {nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;

            const color = getSeverityColor(node.severity);
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={`node-${node.id}`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node glow effect when hovered */}
                {isHovered && (
                  <circle
                    cx={scale.x(pos)}
                    cy={scale.y(pos)}
                    r={28}
                    fill={color.node}
                    opacity={0.15}
                    className="animate-pulse"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={scale.x(pos)}
                  cy={scale.y(pos)}
                  r={20}
                  fill={color.node}
                  opacity={hoveredNode === null || isHovered ? 1 : 0.6}
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all drop-shadow-md"
                />

                {/* Node label */}
                <text
                  x={scale.x(pos)}
                  y={scale.y(pos) + 40}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="600"
                  fill="#111827"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={scale.x(pos) - 60}
                      y={scale.y(pos) - 60}
                      width={120}
                      height={40}
                      rx={6}
                      fill="white"
                      stroke={color.node}
                      strokeWidth={2}
                      filter="url(#shadow)"
                    />
                    <text
                      x={scale.x(pos)}
                      y={scale.y(pos) - 40}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill={color.node}
                      className="pointer-events-none"
                    >
                      {color.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Shadow filter definition */}
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {severities.map((severity) => {
          const color = getSeverityColor(severity);
          return (
            <div key={severity} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white drop-shadow-md"
                style={{ backgroundColor: color.node }}
              />
              <span className="text-sm font-medium text-gray-700">{color.label}</span>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-blue-700 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Hover over connections</span> to see relationships between biomarkers.
          Closer nodes indicate stronger correlations.
        </p>
      </div>
    </div>
  );
}
