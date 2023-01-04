import { createHash } from "crypto";
import { json2xml } from "xml-js";

export class PluginDescription {
    _declaration = { _attributes: { version: "1.0", encoding: "utf-8" } };
    root = {
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
    };

    set content(buffer: Buffer) {
        var hash = createHash("sha256");
        hash.update(buffer);
        this.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data.content._cdata =
            buffer.toString("base64");
        this.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.content_hash =
            hash.digest("hex");
    }

    set label(str: string) {
        this.root.plugins.plugin._attributes.label = str;
        this.root.plugins.plugin.translations.translation._attributes.val = str;
        this.root.plugins.plugin.plugin_data.plugin_data_item.hosted_plugin_data._attributes.name =
            str;
    }

    get xml() {
        const json = JSON.stringify(this);
        const xml = json2xml(json, { compact: true, spaces: 4 });
        return xml;
    }
}
