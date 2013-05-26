/**
 * 
 */
var fileList;
var tableMap = {};
var tabIndex = {};
var currentPanel;
var curTab = -1;

$.fn.dataTableExt.oApi.fnFilterClear = function(oSettings)
{

    /* Remove global filter */
    oSettings.oPreviousSearch.sSearch = "";

    /* Remove the text of the global filter in the input boxes */
    if (typeof oSettings.aanFeatures.f != 'undefined')
    {
        var n = oSettings.aanFeatures.f;
        for ( var i = 0, iLen = n.length; i < iLen; i++)
        {
            $('input', n[i]).val('');
        }
    }

    /*
     * Remove the search text for the column filters - NOTE - if you have input
     * boxes for these filters, these will need to be reset
     */
    for ( var i = 0, iLen = oSettings.aoPreSearchCols.length; i < iLen; i++)
    {
        oSettings.aoPreSearchCols[i].sSearch = "";
    }

    /* Redraw */
    oSettings.oApi._fnReDraw(oSettings);
};

function renderTabs(alphaList)
{

    fileList = alphaList;
    // console.log(alphaList);
    var tabTemplate = "<li><a href='{href}'>{label}</a></li>";
    var tabContentTemplate = "<div id='{tab-id}'></div>";
    var tabs = $("#tabs");// .addClass("ui-tabs-vertical

    var count = 0;
    $.each(alphaList, function(key, value)
    {

        var id = "tab-" + count;
        tabIndex[key] = count;

        var li = $(tabTemplate.replace(/\{href\}/g, "#" + id)
                .replace(/\{label\}/g, key));
        tabs.find("ul").append(li);
        var tabsDiv = $(tabContentTemplate.replace(/\{tab-id\}/g, id));
        tabs.append(tabsDiv);
        count++;
    });

    tabs = $("#tabs").tabs({
        beforeActivate : tabSelected,
        active : -1,
    });

    tabs.tabs("refresh");
    tabs.tabs("option", "active", 0);
    tabs.tabs("refresh");
    curTab = 0;
};

function populateTableInTab(panel, content)
{

    var tabContent = tableMap[panel];
    if (tabContent == null)
    {
        var tableData = [];
        $.each(content, function(key, value)
        {

            tableData.push([ key, value ]);
            // console.log(key + "-" + value);
        });
        tableMap[panel] = tableData;
        tabContent = tableData;
    }

    currentPanel = panel.substring(1);
    var tabId = "tabData-" + currentPanel;

    $(panel).append("<table id='" + tabId + "'></table>");
    var dataTable = $("#" + tabId).dataTable({
        "bProcessing" : true,
        "bFilter" : true,
        "bSort" : false,
        "aaData" : tabContent,
        "aoColumns" : [ {
            "sTitle" : "சொல்",
            "bSortable" : false
        }, {
            "sTitle" : "அருஞ்சொற்பொருள்",
            "bSortable" : false
        } ],
        "bLengthChange" : false,
        "bScrollInfinite" : true,
        "bDestroy" : true,
        "iDisplayLength" : 100,
        "sScrollY" : "400px",
        "bJQueryUI" : true,
        "bDeferRender" : true,
        "sDom" : '"<"H"lr>t<"F"ip>"',
        "oLanguage" : {
            "sLoadingRecords": "தயவு செய்து காத்திருக்கவும்...",
            "sInfo": "_TOTAL_ சொற்களில், _START_ முதல் _END_ சொற்கள் காண்பிக்கபடுகின்றன ",
            "sZeroRecords" : "<b>உங்கள் தேடல் எந்த சொல்லுடனும் பொருந்தவில்லை.</b>"
        }
    });
    //console.log("Current Panel: " + currentPanel);

    var searchBox = $("#wordSearch");
    var searchTxt = searchBox.val().trim();
    var dataTabs = $("#tabData-" + currentPanel).dataTable();
    if (searchTxt != null && searchTxt != "")
    {
        filterEntries(searchTxt);
    }

};

function tabSelected(event, ui)
{
    if(event.clientX)
    {
        var searchBox = $("#wordSearch").val("");
        filterEntries(null, true);
    }
    var selectedChar = ui.newTab.text();
    // console.log("Tab selected: " + event + " " + ui.newTab + selectedChar);
    fileName = fileList[selectedChar];
    loadFile(fileName, function(response)
    {
        populateTableInTab(ui.newPanel.selector, response);
    });

};

function handleSearch(event)
{

    // console.log("handling keypress: " + event.which + " evnt: " + event);

    if (event.which == 13)// || event.which == 32)
    {
        var searchBox = $("#wordSearch");
        var searchTxt = searchBox.val().trim();
        if (searchTxt != null && searchTxt != "")
        {
            if (searchTxt.charCodeAt(0) < 255)
            {
                google.language
                        .transliterate([ searchTxt ], "en", "ta", function(result)
                        {
                            if (!result.error)
                            {
                                if (result.transliterations && result.transliterations.length > 0 && result.transliterations[0].transliteratedWords.length > 0)
                                {
                                    searchBox
                                            .val(result.transliterations[0].transliteratedWords[0]);
                                    searchTxt = searchBox.val().trim();
                                    //console.log("Changed Text: " + searchTxt);
                                    var newTab = tabIndex[searchTxt.charAt(0)];
                                    //console.log("New Tab " + newTab);
                                    if (newTab != curTab)
                                    {
                                        $("#tabs").tabs("option", "active", newTab);
                                    }
                                    else
                                    {
                                        //console.log("search in the same tab" +  searchTxt);
                                        var dataTabs = $("#tabData-" + currentPanel).dataTable();
                                        dataTabs.fnFilter(searchTxt, 0);
                                        $("#tabData-" + currentPanel).highlight(searchTxt);
                                    }
                                }
                            }

                        });
            }
            else
            {
                filterEntries(searchTxt);
                //console.log("Already Transliterated");
            }
        }
        else
        {
            filterEntries(null, true);
        }

    }

};

function filterEntries(searchText, bClearFilter)
{
    //console.log("Filtering " + searchText + " " +  bClearFilter);
    var dataTabs = $("#tabData-" + currentPanel).dataTable();
    if(bClearFilter)
    {
        dataTabs.fnFilterClear();
    }
    else
    {
        dataTabs.fnFilter(searchText, 0);
        $("#tabData-" + currentPanel).highlight(searchText);
    }
};

function loadFile(url, cbk)
{
    // console.log("Loading file: " + url + " callback: " + cbk);
    $.getJSON(url, cbk);
};

function printResponse(response)
{
    console.log(response);
    $.each(response, function(key, value)
    {

        console.log(key + "-" + value);
    });

};