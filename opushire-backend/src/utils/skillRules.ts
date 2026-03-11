function titleCase(str: string): string {
    return str.toLowerCase().split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function ruleNormalize(skill: string): string {
    let s = skill.trim();

    // Remove stray periods if they don't seem like standard naming (e.g. Node.js is fine, but D.O.C.K.E.R is not)
    // For safety, preserving simple periods, just replacing multiple spaces
    s = s.replace(/\s+/g, " ");

    if (/^c\s*\+\+$/i.test(s)) return "C++";
    if (/^c\s*#$/i.test(s)) return "C#";

    return titleCase(s);
}
