#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# License: BSD
#   https://github.com/splintered-reality/py_trees_viz/raw/devel/LICENSE
#
##############################################################################
# Documentation
##############################################################################

"""
Launch a qt dashboard for the tutorials.
"""
##############################################################################
# Imports
##############################################################################

import PyQt5.QtCore as qt_core
import PyQt5.QtWidgets as qt_widgets

from . import main_window_ui
from .. import console

##############################################################################
# Helpers
##############################################################################


class MainWindow(qt_widgets.QMainWindow):

    request_shutdown = qt_core.pyqtSignal(name="requestShutdown")

    def __init__(self):
        super().__init__()
        self.ui = main_window_ui.Ui_MainWindow()
        self.ui.setupUi(self)
        self.readSettings()

    def closeEvent(self, event):
        console.logdebug("received close event [main_window]")
        self.request_shutdown.emit()
        self.writeSettings()
        super().closeEvent(event)

    def readSettings(self):
        console.logdebug("read settings [main_window]")
        settings = qt_core.QSettings("Splintered Reality", "PyTrees Viewer")
        geometry = settings.value("geometry")
        if geometry is not None:
            self.restoreGeometry(geometry)
        window_state = settings.value("window_state")  # full size, maximised, minimised, no state
        if window_state is not None:
            self.restoreState(window_state)

    def writeSettings(self):
        console.logdebug("write settings [main_window]")
        settings = qt_core.QSettings("Splintered Reality", "PyTrees Viewer")
        settings.setValue("geometry", self.saveGeometry())
        settings.setValue("window_state", self.saveState())  # full size, maximised, minimised, no state