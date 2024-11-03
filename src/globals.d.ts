import { asserts } from './lib/assert/assert';

declare const global: NodeJS.Global & typeof globalThis;

declare global {
	var assert: typeof asserts;
}
