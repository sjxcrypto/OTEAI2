import { rest } from 'msw';

const mockFiles = [
  { id: '1', name: 'index.ts', type: 'file', path: '/index.ts' },
  { id: '2', name: 'src', type: 'directory', path: '/src' },
];

export const handlers = [
  rest.get('/api/fs/list', (req, res, ctx) => {
    return res(ctx.json(mockFiles));
  }),

  rest.get('/api/fs/read', (req, res, ctx) => {
    return res(ctx.json({ content: '// Sample content' }));
  }),

  rest.get('/api/git/status', (req, res, ctx) => {
    return res(ctx.json({
      modified: [],
      added: [],
      deleted: [],
      staged: [],
      branch: 'main'
    }));
  }),

  rest.post('/api/ai/completion', (req, res, ctx) => {
    return res(ctx.json({
      completion: '// AI generated completion',
      alternatives: [
        '// Alternative 1',
        '// Alternative 2'
      ]
    }));
  }),

  rest.get('/api/git/branches', (req, res, ctx) => {
    return res(ctx.json({
      branches: ['main', 'develop', 'feature/test']
    }));
  }),

  rest.post('/api/git/checkout', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.post('/api/git/pull', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.post('/api/git/push', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('/api/git/diff', (req, res, ctx) => {
    return res(ctx.json({
      diffs: [{
        path: 'src/index.ts',
        hunks: [{
          oldStart: 1,
          oldLines: 3,
          newStart: 1,
          newLines: 4,
          lines: [
            ' import React from "react";',
            '-import ReactDOM from "react-dom";',
            '-import App from "./App";',
            '+import { createRoot } from "react-dom/client";',
            '+import App from "./App";',
            '+import "./index.css";',
          ]
        }]
      }]
    }));
  }),
];

export { handlers }; 