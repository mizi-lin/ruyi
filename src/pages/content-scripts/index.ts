Promise.all([import('./app'), import('./domloaded')]).then(([{ render }, { domloaded }]) => {
    domloaded();
    return render();
});

export {};
