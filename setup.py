#!/usr/bin/env python3

################################################################################
# This is a minimal setup.py for enabling ROS builds.
#
# For all other modes of development, use poetry and pyproject.toml
################################################################################

import os

from setuptools import find_packages, setup


def gather_js_files():
    data_files = []
    for root, unused_subdirs, files in os.walk("js"):
        destination = os.path.join("share", package_name, root)
        js_files = []
        for file in files:
            pathname = os.path.join(root, file)
            js_files.append(pathname)
        data_files.append((destination, js_files))
    return data_files


package_name = "py_trees_js"

setup(
    name=package_name,
    # version needs to be updated in several places
    #   package.xml
    #   pyproject.toml
    #   py_trees-<version>.js (and version variable therein)
    #   py_trees-<version.css>
    #   py_trees_js/viewer/html/index.html
    #   py_trees_js/resources.qrc
    version="0.6.6",
    packages=find_packages(exclude=["tests*", "docs*"]),
    data_files=[("share/" + package_name, ["package.xml"])] + gather_js_files(),
    package_data={"py_trees_js": ["viewer/*.ui", "viewer/html/*", "viewer/images/*"]},
    author="Daniel Stonier",
    maintainer="Daniel Stonier <d.stonier@gmail.com>",
    url="https://github.com/splintered-reality/py_trees_js",
    keywords=["ROS", "ROS2", "behaviour-trees", "Qt"],
    zip_safe=True,
    classifiers=[
        "Intended Audience :: Developers",
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries",
    ],
    description=(
        "Javascript libraries for visualising executing or log-replayed behaviour trees"
    ),
    long_description=(
        "Javascript libraries for visualising executing or log-replayed behaviour trees."
        "Includes a qt-js hybrid viewer for development and demonstration purposes."
    ),
    license="BSD",
    entry_points={
        "console_scripts": [
            "py-trees-demo-viewer = py_trees_js.viewer.viewer:main",
        ],
    },
)
