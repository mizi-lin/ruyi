
export {};
declare global {
    type FC<P = {}> = import('react').FC<P>;
    type PropsWithChildren = import('react').PropsWithChildren;
    type CSSProperties = import('react').CSSProperties;
    type ReactNode = import('react').ReactNode;   
    type ChangeEvent<T> = import('react').ChangeEvent<T>;
    type RecoilValue<T> = import('recoil').RecoilValue<T>;
    // The Recoil types for `selectorFamily` have a bug in which they do not
    // allow interfaces to be passed in as a parameter.
    //
    // Therefore, I rewrote the `SelectorMapper` type I found in a comment to handle
    // interfaces in deep object hierarchies using TypeScript's conditional types and
    // mapped types features.
    //
    // See: https://github.com/facebookexperimental/Recoil/issues/629#issuecomment-797000984
    // See: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
    // See: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
    type CreateSerializableParam<Type> = {
        // We construct a new mapped type in which the keys are the keys of the original type and the values are
        // converted from interface types into normal types (which appears to happen implicitly when using mapped types).
        //
        // When the type of a property is already a `SerializableParam` we return it as-is.
        // But if it is not, we should check to see if it it is a record/object or undefined and then recursively map it.
        // Finally, if it matches neither of these conditions we should return it as-is.
        [Property in keyof Type]: Type[Property] extends import('recoil').SerializableParam
            ? Type[Property]
            : Type[Property] extends Record<string, any> | undefined | null
            ? CreateSerializableParam<Type[Property]>
            : Type[Property];
    };
}


