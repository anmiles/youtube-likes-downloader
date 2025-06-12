import '@anmiles/prototypes';

export class SequentialArray<T> {
	private index: number;

	constructor(private readonly array: T[]) {
		this.index = 0;
	}

	next(): T | undefined {
		return this.array[this.index++];
	}
}
