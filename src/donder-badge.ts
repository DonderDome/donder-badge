/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers
import { CARD_VERSION } from './constants';
import './editor';

import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';

/* eslint no-console: 0 */
console.info(
  `%c  donder-badge \n%c  version: ${CARD_VERSION}  `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'donder-badge',
  name: 'Boilerplate Card',
  description: 'A template custom card for you to create something awesome',
});

export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // REPLACE "donder-badge" with widget name, everywhere in the project
    // REPLACE the file name with the actual widget name
    return document.createElement('donder-badge-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error('Invalid configuration');
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Boilerplate',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      /* REPLACE "donder-badge" with actual widget name */
      .type-custom-donder-badge {
        height: 100%;
        width: 100%;
      }
      .donder-badge {
        
      }
      .state-badge {
        width: 70px;
        height: 70px;
        border-radius: 100%;
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        background: var(--label-badge-background-color);
        font-size: .8em;
        --mdc-icon-size: 1.7em;
      }
    `;
  }

  private _handleMoreInfoAction(ev: ActionHandlerEvent, entity): void {
    ev.stopPropagation();
    console.log(entity)
    // this.hass.callService('browser_mod', 'more_info', {
    //   entity: entity,
    // })
  }

  protected renderClimateBadge(config): TemplateResult {
    // Climate: Opens more info, shows temperature on off/on, has an "On" UI when on
    const { entity } = config
    const { state, attributes } = this.hass.states[entity]

    return html`
      <ha-card
        @action=${(ev) => this._handleMoreInfoAction(ev, entity)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        class=${`climate-badge state-badge ${state}`}
      >
        <ha-icon icon='mdi:thermometer'></ha-icon>
        <div>${attributes.current_temperature}${attributes.temperature_unit}</div>
      </ha-card>
    `
  }

  protected renderLightBadge(config): TemplateResult {
    console.log(config);
    // Light: Toggles on/of, show "On" UI when on
    return html`
      <div class='light-badge state-badge'>
        <ha-icon icon='mdi:lightbulb'></ha-icon>
        <span>On</span>
      </div>
    `
  }

  protected renderShutterBadge(config): TemplateResult {
    console.log(config);
    // Shutter: Toggles more info, shows icon and no on/off status
    return html`
      <div class='shutter-badge state-badge'>
        <ha-icon icon='mdi:window-shutter'></ha-icon>
      </div>
    `
  }

  protected renderGadgetBadge(config): TemplateResult {
    console.log(config);
    // Gadget: Same as light, different icon
    return html`
      <div class='gadget-badge state-badge'>
        <ha-icon icon='mdi:lightbulb'></ha-icon>
        <span>On</span>
      </div>
    `
  }

  protected renderBadge(config): TemplateResult {
    const { entityType } = config
    if (entityType === 'climate') {
      return this.renderClimateBadge(config)
    } else if (entityType === 'light') {
      return this.renderLightBadge(config)
    } else if (entityType === 'shutter') {
      return this.renderShutterBadge(config)
    } else if (entityType === 'gadget') {
      return this.renderGadgetBadge(config)
    } else {
      return html`
        <div class='unknown-badge'>
          <ha-icon icon='mdi:help'></ha-icon>
        </div>
      `
    }
  }

  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning('warning message');
    }

    if (this.config.show_error) {
      return this._showError('error message');
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
      >
        <div class='donder-badge'>
          ${this.renderBadge(this.config)}
        </div>
      </ha-card>
    `;
  }
}

customElements.define("donder-badge", BoilerplateCard);
