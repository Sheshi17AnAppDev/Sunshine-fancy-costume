document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/site-content/about');
        if (!res.ok) return;

        const { data } = await res.json();
        if (!data) return;

        const storyLabel = document.getElementById('about-story-label');
        const storyTitle = document.getElementById('about-story-title');
        const introTitle = document.getElementById('about-intro-title');
        const p1 = document.getElementById('about-p1');
        const p2 = document.getElementById('about-p2');
        const whyTitle = document.getElementById('about-why-title');

        if (storyLabel && data.story?.label) storyLabel.textContent = data.story.label;
        if (storyTitle && data.story?.title) storyTitle.innerHTML = String(data.story.title).replace(/\n/g, '<br>');

        if (introTitle && data.intro?.title) introTitle.textContent = data.intro.title;
        if (p1 && data.intro?.paragraph1) p1.textContent = data.intro.paragraph1;
        if (p2 && data.intro?.paragraph2) p2.textContent = data.intro.paragraph2;

        if (whyTitle && data.why?.title) whyTitle.textContent = data.why.title;

    } catch (e) {
        console.error('Failed to load about content', e);
    }
});
