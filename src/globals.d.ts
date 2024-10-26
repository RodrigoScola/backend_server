import { asserts } from './src/lib/Assert/assert';

declare const global: NodeJS.Global & typeof globalThis;

declare global {
	var assert: typeof asserts;
}
