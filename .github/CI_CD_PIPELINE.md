<div align="center">
  <h1>⚙️ Automation Workflows</h1>
  <p><strong>GitHub Actions CI/CD Pipeline</strong></p>
</div>

OpusHire uses fully automated **CI/CD loops** to transition the latest Node.js/Next.js commits directly to our Azure Cloud instances.

## 🚀 The Pipeline (Azure Web App Deploy)

Triggered automatically upon `git push` to specific branches.

### Build Strategy
- **Runner Instance**: `ubuntu-latest`
- **Node Caching**: Leverages persistent `npm` caching aggressively to slash cold-start install times.
- **Next.js Standalone Mode**: Triggers a raw `.next/standalone` optimized build payload inside the runner, slashing unnecessary dev-dependencies.

### Deployment Targets
- Uses GitHub Secrets (`AZURE_WEBAPP_PUBLISH_PROFILE`) to authenticate against the App Service instance via Microsoft's `azure/webapps-deploy@v2` wrapper.
- Zips compiled artifacts locally inside GitHub Actions, transferring the payload directly to the Azure Kudu engine where it extracts & launches within 15 seconds.

## 🛡 Security & Audit Layer
Beyond deployments, our `.github` directory facilitates routine audits. We employ sophisticated **Dependabot** tracking targeting explicit vulnerability CVEs (such as Prototype Pollution and SSRF in dependencies), requiring forced multi-resolution patches locally before clearing CI runs.
