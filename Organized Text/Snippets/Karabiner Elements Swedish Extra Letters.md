Requires ABC - Extended layout
```
{
    "manipulators": [
        {
            "description": "Swedish Extra Letters - ABC Extended Layout",
            "from": {
                "key_code": "caps_lock",
                "modifiers": { "optional": ["any"] }
            },
            "to": [
                {
                    "key_code": "left_shift",
                    "modifiers": ["left_command", "left_control", "left_option"]
                }
            ],
            "type": "basic"
        },
        {
            "description": "Caps Lock + [ triggers Option+K then A.",
            "from": {
                "key_code": "open_bracket",
                "modifiers": { "mandatory": ["command", "control", "option", "shift"] }
            },
            "to": [
                {
                    "key_code": "k",
                    "modifiers": ["left_option"]
                },
                { "key_code": "a" }
            ],
            "type": "basic"
        },
        {
            "description": "Caps Lock + ' triggers Option+U then A.",
            "from": {
                "key_code": "quote",
                "modifiers": { "mandatory": ["command", "control", "option", "shift"] }
            },
            "to": [
                {
                    "key_code": "u",
                    "modifiers": ["left_option"]
                },
                { "key_code": "a" }
            ],
            "type": "basic"
        },
        {
            "description": "Caps Lock + ; triggers Option+U then O.",
            "from": {
                "key_code": "semicolon",
                "modifiers": { "mandatory": ["command", "control", "option", "shift"] }
            },
            "to": [
                {
                    "key_code": "u",
                    "modifiers": ["left_option"]
                },
                { "key_code": "o" }
            ],
            "type": "basic"
        }
    ]
}
```