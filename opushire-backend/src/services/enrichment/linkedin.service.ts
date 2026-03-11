export function mockLinkedInExtract(url: string): { certifications: string[], linkedin: string } {
    return {
        certifications: ["AWS Cloud Practitioner", "Scrum Master"], 
        linkedin: url
    };
}
