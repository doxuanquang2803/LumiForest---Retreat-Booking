export class LifecycleManager {
  static currentModule = null;

  static async loadModule(modulePromise) {
    try {
      const module = await modulePromise;
      
      // Clean up previous module
      if (this.currentModule && typeof this.currentModule.destroy === 'function') {
        this.currentModule.destroy();
      }

      this.currentModule = module.default || module;
      
      if (typeof this.currentModule.init === 'function') {
        this.currentModule.init();
      }
    } catch (error) {
      console.error('Failed to load module:', error);
    }
  }
}
