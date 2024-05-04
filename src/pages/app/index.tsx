Promise.all([import('./root'), import('./app')]).then(([{ render }, { App }]) => {
    return render(App);
});

export default {};
