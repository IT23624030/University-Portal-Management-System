test("Check event title rendering", () => {
    document.body.innerHTML = `<h1>Event Management</h1>`;
    const heading = document.querySelector("h1");

    expect(heading.textContent).toBe("Event Management");
});