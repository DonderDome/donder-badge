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
      // handleAction(this, this.hass, this.config, ev.detail.action);
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
        background: transparent;
      }
      .donder-badge {
        
      }
      .state-badge {
        width: 60px;
        height: 60px;
        border-radius: 100%;
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        background: var(--primary-background-color);
        font-size: .8em;
        --mdc-icon-size: 1.7em;
        text-transform: capitalize;
      }
      .state-badge.off {
        color: rgba(255, 255, 255, .7);
        background: var(--primary-background-color);
      }
      .state-badge.on {
        color: var(--primary-background-color);
        background: var(--primary-color);
      }
    `;
  }

  private _handleMoreInfoAction(ev: ActionHandlerEvent, config): void {
    console.log("more-info", config)
    ev.stopPropagation();
    this.hass.callService('browser_mod', 'more_info', {
      entity: config.entity,
    })
  }

  private _handleLightAction(ev: ActionHandlerEvent, config): void {
    console.log("light", config)
    const { entity, entity_data, entity_type } = config

    ev.stopPropagation();

    switch(entity_type) {
      case "boolean":
        this.hass.callService('input_boolean', 'toggle', {entity_id: entity})
        break
      case "lights":
        this.hass.callService('light', 'toggle', {entity_id: entity, ...entity_data})
        break
      case "switch":
        this.hass.callService('switch', 'toggle', {entity_id: entity})
        break
    }
  }

  protected renderClimateBadge(config): TemplateResult {
    // Climate: Opens more info, shows temperature on off/on, has an "On" UI when on
    const { entity } = config
    const { state, attributes } = this.hass.states[entity]

    return html`
      <ha-card
        @action=${(ev) => this._handleMoreInfoAction(ev, config)}
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
    // Light: Toggles on/of, show "On" UI when on
    const { entity } = config
    const { state } = this.hass.states[entity]
    
    return html`
      <ha-card
        @action=${(ev) => this._handleLightAction(ev, config)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        class=${`light-badge state-badge ${state}`}
      >
        <ha-icon icon='mdi:thermometer'></ha-icon>
        <div>${state}</div>
      </ha-card>
    `
  }

  protected renderShutterBadge(config): TemplateResult {
    // Shutter: Toggles more info, shows icon and no on/off status
    const { entity } = config
    const { state } = this.hass.states[entity]

    return html`
      <ha-card
        @action=${(ev) => this._handleMoreInfoAction(ev, config)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        class=${`shutter-badge state-badge ${state}`}
      >
        <ha-icon icon='mdi:thermometer'></ha-icon>
      </ha-card>
    `
  }

  protected renderGadgetBadge(config): TemplateResult {
    // Gadget: Same as light, different icon
    const { entity } = config
    const { state } = this.hass.states[entity]
    
    return html`
      <ha-card
        @action=${(ev) => this._handleLightAction(ev, config)}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        class=${`gadget-badge state-badge ${state}`}
      >
        <ha-icon icon='mdi:thermometer'></ha-icon>
        <div>${state}</div>
      </ha-card>
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
