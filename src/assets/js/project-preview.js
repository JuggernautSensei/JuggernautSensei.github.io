const projectPath = /^\/projects\/[a-z0-9-]+\/$/;

if (document.documentElement.classList.contains("embedded")) {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      window.parent.postMessage({type:"portfolio:close"}, location.origin);
    }
  });
  document.addEventListener("click", event => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin) {
      link.target = "_blank";
      link.rel = "noopener";
    } else if (url.pathname === location.pathname && url.hash) {
      event.preventDefault();
      document.getElementById(decodeURIComponent(url.hash.slice(1))).scrollIntoView();
      history.replaceState(null, "", url);
    } else if (projectPath.test(url.pathname)) {
      event.preventDefault();
      window.parent.postMessage({type:"portfolio:project", href:url.href}, location.origin);
    }
  });
} else {
  const dialog = document.querySelector(".project-dialog");
  if (dialog) {
    const frame = dialog.querySelector("iframe");
    const expand = dialog.querySelector(".project-expand");
    const close = dialog.querySelector(".project-close");
    let opener;

    function showProject(url) {
      const standalone = new URL(url);
      standalone.searchParams.delete("embed");
      expand.href = standalone.href;
      const embedded = new URL(standalone);
      embedded.searchParams.set("embed", "1");
      frame.contentWindow.location.replace(embedded.href);
      if (!dialog.open) {
        dialog.showModal();
        document.documentElement.classList.add("project-open");
        close.focus();
      }
    }

    function dismissProject() {
      if (!dialog.open) return;
      dialog.close();
      document.documentElement.classList.remove("project-open");
      frame.contentWindow.location.replace("about:blank");
      opener?.focus({preventScroll:true});
    }

    function closeProject() {
      if (!dialog.open) return;
      dismissProject();
      if (history.state?.portfolioPreview) history.back();
      else {
        const url = new URL(location.href);
        url.searchParams.delete("project");
        history.replaceState(history.state, "", url);
      }
    }

    function restorePreview() {
      const slug = new URL(location.href).searchParams.get("project");
      if (!slug) dismissProject();
      else if (/^[a-z0-9-]+$/.test(slug)) showProject(new URL(`/projects/${slug}/`, location.origin));
    }

    document.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || !projectPath.test(url.pathname)) return;
      event.preventDefault();
      opener = link;
      const previewUrl = new URL(location.href);
      previewUrl.searchParams.set("project", url.pathname.split("/")[2]);
      history.pushState({...history.state, portfolioPreview:true}, "", previewUrl);
      showProject(url);
    });
    close.addEventListener("click", closeProject);
    dialog.addEventListener("cancel", event => { event.preventDefault(); closeProject(); });
    dialog.addEventListener("click", event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeProject();
    });
    window.addEventListener("popstate", restorePreview);
    window.addEventListener("message", event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === "portfolio:close") { closeProject(); return; }
      if (event.data?.type !== "portfolio:project") return;
      const url = new URL(event.data.href);
      if (url.origin !== location.origin || !projectPath.test(url.pathname)) return;
      const previewUrl = new URL(location.href);
      previewUrl.searchParams.set("project", url.pathname.split("/")[2]);
      history.replaceState(history.state, "", previewUrl);
      showProject(url);
    });
    restorePreview();
  }
}
