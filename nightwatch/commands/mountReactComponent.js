module.exports = class Command {
  async command(componentName, props, cb = function() {}) {
    let scriptContent = `
    import React from '/node_modules/.vite/react';
    import ReactDOM from '/node_modules/.vite/react-dom.js'
    import Component from '${componentName}';
    const element = React.createElement(Component, ${typeof props == 'string' ? props : JSON.stringify(props)});
    ReactDOM.render(element, document.getElementById('app'));
    window['@component_element'] = element;
    window['@component_class'] = Component;
    `
  
    const scriptFn = function(scriptContent) {
      var scriptEl = document.createElement('script');
      scriptEl.type = 'module';
      scriptEl.innerHTML = scriptContent;
      document.body.appendChild(scriptEl);
    }

    const renderedElement = await this.api
      .launchComponentRenderer()
      .pause(1000)
      .execute(scriptFn, [scriptContent])
      .pause(this.client.argv.debug ? 0 : 500)
      .execute(function() {
        return document.querySelectorAll('#app')[0].firstElementChild
      }, [], (result) => {
        if (!result || !result.value) {
          throw new Error('Could not mount the component. Run nightwatch with --devtools and --debug flags (Chrome only) and investigate the error in the browser console.')
        }

        const componentInstance = this.api.createElement(result.value, {
          isComponent: true,
          type: 'react'
        });

        cb(componentInstance);

        return componentInstance;
      });

    return renderedElement;
  }
}
