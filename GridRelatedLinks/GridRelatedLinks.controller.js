angular.module("umbraco")
    .controller("ID.RelatedLinksController",
        function ($rootScope, $scope, dialogService, iconHelper, assetsService) {

            if (!$scope.control.value) {
                $scope.control.value = [];
            }

            $scope.control.config = {
                "max": $scope.control.editor.config.max
            };

            $scope.control.config.max = isNumeric($scope.control.config.max) && $scope.control.config.max !== 0 ? $scope.control.config.max : Number.MAX_VALUE;
            
            $scope.newCaption = '';
            $scope.newLink = 'http://';
            $scope.newNewWindow = false;
            $scope.newInternal = null;
            $scope.newInternalName = '';
            $scope.newInternalIcon = null;
            $scope.addExternal = false;
            $scope.currentEditLink = null;
            $scope.hasError = false;
            $scope.rowAreas = $scope.row.areas.length;

            $scope.internal = function($event) {

               $scope.currentEditLink = null;

               $scope.contentPickerOverlay = {};
               $scope.contentPickerOverlay.view = "contentpicker";
               $scope.contentPickerOverlay.multiPicker = false;
               $scope.contentPickerOverlay.show = true;

               $scope.contentPickerOverlay.submit = function(control) {

                  select(control.selection[0]);

                  $scope.contentPickerOverlay.show = false;
                  $scope.contentPickerOverlay = null;
               };

               $scope.contentPickerOverlay.close = function(oldModel) {
                  $scope.contentPickerOverlay.show = false;
                  $scope.contentPickerOverlay = null;
               };

               $event.preventDefault();
            };

            $scope.selectInternal = function($event, link) {

               $scope.currentEditLink = link;

               $scope.contentPickerOverlay = {};
               $scope.contentPickerOverlay.view = "contentpicker";
               $scope.contentPickerOverlay.multiPicker = false;
               $scope.contentPickerOverlay.show = true;

               $scope.contentPickerOverlay.submit = function(model) {

                  select(control.selection[0]);

                  $scope.contentPickerOverlay.show = false;
                  $scope.contentPickerOverlay = null;
               };

               $scope.contentPickerOverlay.close = function(oldModel) {
                  $scope.contentPickerOverlay.show = false;
                  $scope.contentPickerOverlay = null;
               };

               $event.preventDefault();

            };

            $scope.edit = function (idx) {
                for (var i = 0; i < $scope.control.value.length; i++) {
                    $scope.control.value[i].edit = false;
                }
                $scope.control.value[idx].edit = true;
            };

            $scope.saveEdit = function (idx) {
                $scope.control.value[idx].title = $scope.control.value[idx].caption;
                $scope.control.value[idx].edit = false;
            };

            $scope.delete = function (idx) {               
                $scope.control.value.splice(idx, 1);               
            };

            $scope.add = function ($event) {
                if ($scope.newCaption == "") {
                    $scope.hasError = true;
                } else {
                    if ($scope.addExternal) {
                        var newExtLink = new function() {
                            this.caption = $scope.newCaption;
                            this.link = $scope.newLink;
                            this.newWindow = $scope.newNewWindow;
                            this.edit = false;
                            this.isInternal = false;
                            this.type = "external";
                            this.title = $scope.newCaption;
                        };
                        $scope.control.value.push(newExtLink);
                    } else {
                        var newIntLink = new function() {
                            this.caption = $scope.newCaption;
                            this.link = $scope.newInternal;
                            this.newWindow = $scope.newNewWindow;
                            this.internal = $scope.newInternal;
                            this.edit = false;
                            this.isInternal = true;
                            this.internalName = $scope.newInternalName;
                            this.internalIcon = $scope.newInternalIcon;
                            this.type = "internal";
                            this.title = $scope.newCaption;
                        };
                        $scope.control.value.push(newIntLink);
                    }
                    $scope.newCaption = '';
                    $scope.newLink = 'http://';
                    $scope.newNewWindow = false;
                    $scope.newInternal = null;
                    $scope.newInternalName = '';
                    $scope.newInternalIcon = null;
                }
                $event.preventDefault();
            };

            $scope.switch = function ($event) {
                $scope.addExternal = !$scope.addExternal;
                $event.preventDefault();
            };
            
            $scope.switchLinkType = function ($event, link) {
                link.isInternal = !link.isInternal;
                link.type = link.isInternal ? "internal" : "external";
                if (!link.isInternal)
                    link.link = $scope.newLink;
                $event.preventDefault();
            };

            $scope.move = function (index, direction) {
                var temp = $scope.control.value[index];
                $scope.control.value[index] = $scope.control.value[index + direction];
                $scope.control.value[index + direction] = temp;                
            };

            //helper for determining if a user can add items
            $scope.canAdd = function () {
                return $scope.control.config.max <= 0 || $scope.control.config.max > countVisible();
                //return $scope.control.editor.config.max <= 0 || $scope.control.editor.config.max > countVisible();
                //return $scope.control.control.config.max <= 0 || $scope.control.control.config.max > countVisible();
            }

            //helper that returns if an item can be sorted
            $scope.canSort = function () {
                return countVisible() > 1;
            }

            $scope.sortableOptions = {
                axis: 'y',
                handle: '.handle',
                cursor: 'move',
                cancel: '.no-drag',
                containment: 'parent',
                placeholder: 'sortable-placeholder',
                forcePlaceholderSize: true,
                helper: function (e, ui) {
                    // When sorting table rows, the cells collapse. This helper fixes that: http://www.foliotek.com/devblog/make-table-rows-sortable-using-jquery-ui-sortable/
                    ui.children().each(function () {
                        $(this).width($(this).width());
                    });
                    return ui;
                },
                items: '> tr:not(.unsortable)',
                tolerance: 'pointer',
                update: function (e, ui) {
                    // Get the new and old index for the moved element (using the URL as the identifier)
                    var newIndex = ui.item.index();
                    var movedLinkUrl = ui.item.attr('data-link');
                    var originalIndex = getElementIndexByUrl(movedLinkUrl);

                    // Move the element in the model
                    var movedElement = $scope.control.value[originalIndex];
                    $scope.control.value.splice(originalIndex, 1);
                    $scope.control.value.splice(newIndex, 0, movedElement);
                },
                start: function (e, ui) {
                    //ui.placeholder.html("<td colspan='5'></td>");

                    // Build a placeholder cell that spans all the cells in the row: http://stackoverflow.com/questions/25845310/jquery-ui-sortable-and-table-cell-size
                    var cellCount = 0;
                    $('td, th', ui.helper).each(function () {
                        // For each td or th try and get it's colspan attribute, and add that or 1 to the total
                        var colspan = 1;
                        var colspanAttr = $(this).attr('colspan');
                        if (colspanAttr > 1) {
                            colspan = colspanAttr;
                        }
                        cellCount += colspan;
                    });

                    // Add the placeholder UI - note that this is the item's content, so td rather than tr - and set height of tr
                    ui.placeholder.html('<td colspan="' + cellCount + '"></td>').height(ui.item.height());
                }
            };

            //helper to count what is visible
            function countVisible() {
                return $scope.control.value.length;
            }

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            function getElementIndexByUrl(url) {
                for (var i = 0; i < $scope.control.value.length; i++) {
                    if ($scope.control.value[i].link == url) {
                        return i;
                    }
                }

                return -1;
            }

            function select(data) {
                if ($scope.currentEditLink != null) {
                    $scope.currentEditLink.internal = data.id;
                    $scope.currentEditLink.internalName = data.name;
                    $scope.currentEditLink.internalIcon = iconHelper.convertFromLegacyIcon(data.icon);
                    $scope.currentEditLink.link = data.id;
                } else {
                    $scope.newInternal = data.id;
                    $scope.newInternalName = data.name;
                    $scope.newInternalIcon = iconHelper.convertFromLegacyIcon(data.icon);
                }
            }

            //load the seperat css for the editor to avoid it blocking our js loading
            assetsService.loadCss("/App_Plugins/GridRelatedLinks/GridRelatedLinks.css?v2");
        });
