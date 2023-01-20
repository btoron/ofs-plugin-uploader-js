# OFS Plugin Manager

CLI utility to upload plugints to an OFS instance

## Usage:

        pluginmgr upload [OPTIONS] <label>

        Upload plugin

        Options:
        --help            Show help                                          [boolean]
        --version         Show version number                                [boolean]
        --filename                                    [string] [default: "plugin.zip"]
        --save            Save a copy of the XML file       [boolean] [default: false]
        --test            No upload (test mode)             [boolean] [default: false]
        --savefile                                    [string] [default: "plugin.xml"]
        --credentials                           [string] [default: "credentials.json"]
        --descriptorFile                         [string] [default: "descriptor.json"]

## File format

### Credentials File

    {
        "instance": <instance name>,
        "clientId": <client id>,
        "clientSecret": <client secret>
    }

### Descriptor File Example

    {
        "properties": {
            "activity": [
                "aid"
            ],
            "resource": []
        }
    }
