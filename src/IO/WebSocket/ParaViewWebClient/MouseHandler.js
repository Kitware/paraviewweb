export default function createMethods(session) {
    return {
        interaction: (event) => {
            return session.call('viewport.mouse.interaction', [ event ]);
        },
    };
}
