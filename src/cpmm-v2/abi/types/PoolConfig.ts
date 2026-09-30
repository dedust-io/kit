import {
    type Address,
    beginCell,
    type Builder,
    Cell,
    Dictionary,
    type Slice,
} from '@ton/core';
import { Asset } from './Asset';
import { Activation } from './Activation';
import { FeeIn } from './FeeIn';
import { RewardConfig } from './RewardConfig';
import { Optional } from '../../../core';

export interface PoolConfig {
    kind: 'dedust.cpmm.v2.PoolConfig';
    assetX: Asset;
    assetY: Asset;
    creatorAddress: Address | null;
    baseFeeBPS: number;
    creatorFeeBPS: number;
    depositActivation: Activation | null;
    swapActivation: Activation | null;
    feeIn: FeeIn;
    customResolvers: Dictionary<Buffer, Address>;
    allowedRewards: Dictionary<number, RewardConfig>;
}

export namespace PoolConfig {
    export type Input = Optional<
        Omit<PoolConfig, 'kind'>,
        | 'creatorAddress'
        | 'creatorFeeBPS'
        | 'depositActivation'
        | 'swapActivation'
        | 'customResolvers'
        | 'allowedRewards'
    >;

    export const create = (input: Input): PoolConfig => ({
        ...input,
        kind: 'dedust.cpmm.v2.PoolConfig',
        creatorAddress: input.creatorAddress ?? null,
        creatorFeeBPS: input.creatorFeeBPS ?? 0,
        depositActivation: input.depositActivation ?? null,
        swapActivation: input.swapActivation ?? null,
        customResolvers:
            input.customResolvers ?? Dictionary.empty<Buffer, Address>(),
        allowedRewards:
            input.allowedRewards ?? Dictionary.empty<number, RewardConfig>(),
    });

    export const load = (source: Slice) => {
        const assetX = Asset.load(source);
        const assetY = Asset.load(source);
        const creatorAddress = source.loadMaybeAddress();
        const baseFeeBPS = source.loadUint(16);
        const creatorFeeBPS = source.loadUint(16);
        const depositActivation = source.loadBit()
            ? Activation.load(source.loadRef().asSlice())
            : null;
        const swapActivation = source.loadBit()
            ? Activation.load(source.loadRef().asSlice())
            : null;
        const feeIn = FeeIn.load(source);
        const customResolvers = source.loadDict(
            Dictionary.Keys.Buffer(32),
            Dictionary.Values.Address(),
        );

        const allowedRewards = source.loadDict(
            Dictionary.Keys.Uint(2),
            RewardConfig.createDictionaryValue(),
        );

        return create({
            assetX,
            assetY,
            creatorAddress,
            baseFeeBPS,
            creatorFeeBPS,
            depositActivation,
            swapActivation,
            feeIn,
            customResolvers,
            allowedRewards,
        });
    };

    export const store = (poolConfig: PoolConfig) => (to: Builder) => {
        to.store(Asset.store(poolConfig.assetX))
            .store(Asset.store(poolConfig.assetY))
            .storeAddress(poolConfig.creatorAddress)
            .storeUint(poolConfig.baseFeeBPS, 16)
            .storeUint(poolConfig.creatorFeeBPS, 16)
            // Activations are `Maybe ^Activation`: the pool code and `load` above read a
            // presence bit followed by a reference, so they must be stored as a reference.
            .storeMaybeRef(
                poolConfig.depositActivation &&
                    beginCell().store(
                        Activation.store(poolConfig.depositActivation),
                    ),
            )
            .storeMaybeRef(
                poolConfig.swapActivation &&
                    beginCell().store(
                        Activation.store(poolConfig.swapActivation),
                    ),
            )
            .store(FeeIn.store(poolConfig.feeIn))
            .storeDict(poolConfig.customResolvers)
            .storeDict(poolConfig.allowedRewards);
    };

    export const toCell = (poolConfig: PoolConfig): Cell =>
        beginCell().store(store(poolConfig)).endCell();

    export const createCell = (input: Input): Cell => toCell(create(input));
}
