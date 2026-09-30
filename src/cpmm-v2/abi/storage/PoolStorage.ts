import {
    beginCell,
    Builder,
    type Cell,
    Dictionary,
    type Slice,
} from '@ton/core';
import {
    PoolConfig,
    PoolExtra,
    PoolFees,
    PoolReward,
    PoolStatus,
} from '../types';
import { Optional } from '../../../core';

export interface PoolStorage {
    kind: 'dedust.cpmm.v2.PoolStorage';
    config: PoolConfig;
    fees: PoolFees;
    extra: PoolExtra;
    rewards: Dictionary<number, PoolReward>;
    status: PoolStatus;
    depositActive: boolean;
    swapActive: boolean;
    liquidity: bigint;
    reserveX: bigint;
    reserveY: bigint;
}

export namespace PoolStorage {
    export type Input = Optional<
        Omit<PoolStorage, 'kind'>,
        | 'fees'
        | 'extra'
        | 'rewards'
        | 'status'
        | 'depositActive'
        | 'swapActive'
        | 'liquidity'
        | 'reserveX'
        | 'reserveY'
    >;

    export const create = (input: Input): PoolStorage => ({
        ...input,
        kind: 'dedust.cpmm.v2.PoolStorage',
        fees: input.fees ?? PoolFees.create(),
        extra: input.extra ?? PoolExtra.create(),
        rewards: input.rewards ?? Dictionary.empty<number, PoolReward>(),
        status: input.status ?? PoolStatus.uninitialized(),
        depositActive: input.depositActive ?? false,
        swapActive: input.swapActive ?? false,
        liquidity: input.liquidity ?? 0n,
        reserveX: input.reserveX ?? 0n,
        reserveY: input.reserveY ?? 0n,
    });

    export const load = (source: Slice): PoolStorage => {
        const config = PoolConfig.load(source.loadRef().asSlice());
        const fees = PoolFees.load(source.loadRef().asSlice());
        const extra = PoolExtra.load(source.loadRef().asSlice());
        const rewards = source.loadDict(
            Dictionary.Keys.Uint(2),
            PoolReward.createDictionaryValue(),
        );
        const status = PoolStatus.load(source);
        const depositActive = source.loadBit();
        const swapActive = source.loadBit();
        const liquidity = source.loadCoins();
        const reserveX = source.loadCoins();
        const reserveY = source.loadCoins();

        return create({
            config,
            fees,
            extra,
            rewards,
            status,
            depositActive,
            swapActive,
            liquidity,
            reserveX,
            reserveY,
        });
    };

    export const store = (storage: PoolStorage) => (to: Builder) => {
        to.storeRef(PoolConfig.createCell(storage.config))
            .storeRef(PoolFees.toCell(storage.fees))
            .storeRef(beginCell().store(PoolExtra.store(storage.extra)))
            .storeDict(storage.rewards)
            .store(PoolStatus.store(storage.status))
            .storeBit(storage.depositActive)
            .storeBit(storage.swapActive)
            .storeCoins(storage.liquidity)
            .storeCoins(storage.reserveX)
            .storeCoins(storage.reserveY);
    };

    export const fromCell = (cell: Cell): PoolStorage => load(cell.asSlice());

    export const toCell = (storage: PoolStorage): Cell =>
        beginCell().store(store(storage)).endCell();

    export const createCell = (input: Input): Cell => toCell(create(input));
}
