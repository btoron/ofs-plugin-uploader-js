import { throws } from "assert";
import { Console } from "console";
import { createHash } from "crypto";
import { json2xml } from "xml-js";
export enum OFSEntity {
    Activity = "activity",
    Inventory = "inventory",
    Request = "request",
    Resource = "resource",
}

class PropertiesDescription {
    activity: string[] = [];
    resource: string[] = [];
    inventory: string[] = [];
    request: string[] = [];
}

export interface PluginDescription {
    properties?: PropertiesDescription;
}
export class Plugin {
    _data = {
        _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
        root: {
            format: {
                _attributes: {
                    version: 1,
                },
            },
            product: {
                _attributes: {
                    version: "22.11.1",
                },
            },
            plugins: {
                plugin: {
                    _attributes: {
                        label: "label",
                        action_label: "",
                        action_entity: "",
                        action_type: "addon_action",
                        type: "addon",
                    },
                    translations: {
                        translation: {
                            _attributes: {
                                lang: "en",
                                val: "label",
                            },
                        },
                    },
                    fields: {
                        field: [
                            {
                                _attributes: {
                                    label: "aid",
                                    entity: "activity",
                                },
                            },
                        ],
                    },

                    plugin_data: {
                        plugin_data_item: {
                            _attributes: {
                                path: "",
                                post_data: "",
                                width: "",
                                height: "",
                                options: "32",
                                user_agent_mask: "",
                                sort_order: 0,
                                native_app_label: "",
                                auth_type: "",
                                auth_login: "",
                            },
                            hosted_plugin_data: {
                                _attributes: {
                                    name: "label_name",
                                    content_hash: "hash",
                                },
                                content: {
                                    _cdata: "NONE",
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    private _properties: PropertiesDescription;

    set content(buffer: Buffer) {
        var hash = createHash("sha256");
        hash.update(buffer);
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data.content._cdata =
            buffer.toString("base64");
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.content_hash =
            hash.digest("hex");
    }

    set label(str: string) {
        this._data.root.plugins.plugin._attributes.label = str;
        this._data.root.plugins.plugin.translations.translation._attributes.val =
            str;
        this._data.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.name =
            str;
    }

    get xml() {
        const json = JSON.stringify(this._data);
        const xml = json2xml(json, { compact: true, spaces: 4 });
        return xml;
    }

    add_property(label: string, entity: OFSEntity) {
        if (this._properties[entity].includes(label)) {
            process.stderr.write(
                `...Properties: Skipped ${entity}.${label}. Duplicated\n`
            );
        } else {
            process.stderr.write(`...Properties: Added ${entity}.${label}\n`);
            this._data.root.plugins.plugin.fields.field.push({
                _attributes: {
                    label: label,
                    entity: entity,
                },
            });
            this._properties[entity].push(label);
        }
    }

    constructor(description?: PluginDescription) {
        this._properties = {
            activity: ["aid"],
            resource: [],
            inventory: [],
            request: [],
        };
        if (description) {
            description.properties?.activity?.forEach((element) => {
                this.add_property(element, OFSEntity.Activity);
            });
            description.properties?.resource?.forEach((element) => {
                this.add_property(element, OFSEntity.Resource);
            });
            description.properties?.inventory?.forEach((element) => {
                this.add_property(element, OFSEntity.Inventory);
            });
        }
    }
}
