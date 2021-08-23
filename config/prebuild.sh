#!/bin/bash
# FROM: https://github.com/JetBrains/svg-sprite-loader/issues/359#issuecomment-738834513

function abspath() {
    # generate absolute path from relative path
    # $1     : relative filename
    # return : absolute path
    if [ -d "$1" ]; then
        # dir
        (cd "$1"; pwd)
    elif [ -f "$1" ]; then
        # file
        if [[ $1 = /* ]]; then
            echo "$1"
        elif [[ $1 == */* ]]; then
            echo "$(cd "${1%/*}"; pwd)/${1##*/}"
        else
            echo "$(pwd)/$1"
        fi
    fi
}

CURRENT_DIR=`abspath .`
SRC_FILE=`abspath ./config/funcMock.js`
DST_FILE="./node_modules/svg-sprite-loader/lib/utils/get-matched-rule.js"

cd $CURRENT_DIR
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
cd ..
if [ -f "$DST_FILE" ]; then
    cat "$SRC_FILE" > "$DST_FILE"
    exit 0
fi
