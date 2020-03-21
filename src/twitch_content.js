'use strict';

const REPORT_BOT_NAME = 'norreportbot';
const REPORT_BOT_ID = '500840578';


function getInternalInstance(elem) {
    for (const key in elem)
        if (key.startsWith('__reactInternalInstance$'))
            return elem[key];
}

function findInstance(instance, predicate) {
    // Recurse through the parents of an instance until one matching the predicate is found

    let cur = instance,
        depth = 0;

    while (cur && !predicate(cur)) {
        if (!cur.return || depth >= 8)
            return undefined;

        cur = cur.return;
        depth++;
    }

    return cur;
}

// Twitch helpers

function getMessage(elem) {
    const instance = findInstance(
        getInternalInstance(elem),
        i => i.stateNode && i.stateNode.props && i.stateNode.props.message);

    return instance && instance.stateNode.props.message;
}

function getWhisperThread(elem) {
    const instance = findInstance(
        getInternalInstance(elem),
        i => i.stateNode && i.stateNode.props && i.stateNode.props.threadID);

    return instance && instance.stateNode.props;
}

function getChat() {
    const instance = findInstance(
        getInternalInstance(document.querySelector('.chat-room')),
        i => i.stateNode && i.stateNode.props && i.stateNode.props.onSendMessage);

    return instance && instance.stateNode.props;
}

function sendWhisper(target, content) {
    getChat().onSendMessage(`/w ${target} ${content}`);
}

// Functionality starts here

const REPORT_REASONS = {
    current_spoilers: `It contains spoilers for our current topic`,
    other_spoilers: `It contains spoilers for a different topic`,
    rude_offensive: `It's rude, offensive, or a personal attack`,
    disruptive_spam: `It's disruptive, spam, or trolling`,
    irrelevant_sensitive: `It's irrelevant discussion of a sensitive subject`,
    excessively_negative: `It's excessively negative`,
    self_promotion: `It's self-promotion`,
};

const reportDialogTemplate = document.createElement('template')
reportDialogTemplate.innerHTML = `
<div class="nor-report-wrapper">
    <div class="nor-report-dialog">
        <div class="nor-report-header">
            <h3>Report</h3>
            <button class="nor-close-button">
                <svg width="20px" height="20px" version="1.1" viewBox="0 0 20 20" x="0px" y="0px" fill="currentColor">
                    <g><path d="M8.5 10L4 5.5 5.5 4 10 8.5 14.5 4 16 5.5 11.5 10l4.5 4.5-1.5 1.5-4.5-4.5L5.5 16 4 14.5 8.5 10z"></path></g>
                </svg>
            </button>
        </div>
        <div class="nor-message-container"></div>
        <h4>What is wrong with this message?</h4>
        <div class="nor-reason-list">${
            Object.entries(REPORT_REASONS).map(([id, humanText]) => `<button x-reason="${id}">${humanText}</button>`).join('')
        }</div>
    </div>
</div>`;

function sendReport(message, reason) {
    sendWhisper(REPORT_BOT_NAME, `report ${message.id} ${reason}`);
}

function showReportDialog({target}) {
    // This whole thing is pretty ugly, but I just don't know how to use templates correctly.
    const message = getMessage(target.parentElement);
    const messageElement = target.parentElement.cloneNode(true);

    // Clean the cloned message element
    // Remove mod icons
    const modIcon = messageElement.querySelector('.mod-icon');
    if (modIcon) {
        // Find the topmost container of the mod icon that's below the message element
        let elem = modIcon;
        while (elem.parentElement !== messageElement) {
            elem = elem.parentElement;
        }

        messageElement.removeChild(elem);
    }

    // Remove report button
    const messageReportButton = messageElement.querySelector('.nor-report-btn');
    if (messageReportButton)
        messageElement.removeChild(messageReportButton);

    // Create report dialog
    const template = reportDialogTemplate.content.cloneNode(true);
    const report = template.querySelector('.nor-report-wrapper');
    
    report.addEventListener('click', ({target}) => {
        if (target == report)
            document.body.removeChild(report);
    });
    report.querySelector('.nor-close-button').addEventListener('click', () => {
        document.body.removeChild(report);
    });
    report.querySelector('.nor-report-dialog').style['background-color'] = getComputedStyle(document.querySelector('.chat-room'))['background-color'];
    report.querySelector('.nor-message-container').appendChild(messageElement);
    
    for (const reportButton of report.querySelectorAll('.nor-reason-list button')) {
        const reason = reportButton.getAttribute('x-reason')
        reportButton.addEventListener('click', () => {
            sendReport(message, reason);
            document.body.removeChild(report);
        });
    }

    document.body.appendChild(report);
}

const newElementListeners = {
    'chat-line__message': elem => {
        const message = getMessage(elem);
        if (!message) return;

        if (message.id.indexOf('-') != -1 && getChat().authToken) {
            // Your own messages don't have a proper ID, so we ignore them
            // This is fine because you wouldn't want to report yourself anyway

            // Add report button
            let reportButton = document.createElement('button');
            reportButton.classList.add('nor-report-btn');
            reportButton.innerText = 'Report';
            reportButton.addEventListener('click', showReportDialog);
            elem.appendChild(reportButton);
        }
    },

    'thread-header__title-bar-container': elem => {
        const thread = getWhisperThread(elem);
        if (!thread) return;

        // Thread IDs are of the form <user 1 id>_<user 2 id>
        if (thread.threadID.split('_').includes(REPORT_BOT_ID)) {
            // Close any thread with the report bot, so it doesn't clutter your screen
            thread.onClose();
        }
    }
}

const observer = new MutationObserver(function mutationCallback(mutations) {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            const cl = node.classList;
            if (!cl) continue;

            for (const [className, callback] of Object.entries(newElementListeners)) {
                if (node.classList.contains(className))
                    callback(node);

                for (const childNode of node.getElementsByClassName(className))
                    callback(childNode);
            }
        }
    }
});

observer.observe(document.body, {
    subtree: true,
    childList: true,
});
