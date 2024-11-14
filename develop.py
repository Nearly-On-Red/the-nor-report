import os
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path
import shutil


root = Path(__file__).parent
src = root / 'src'
chrome = root / '.chrome'
firefox = root / '.firefox'

firefox.mkdir(parents=True, exist_ok=True)
chrome.mkdir(parents=True, exist_ok=True)

def copy(source):
    if source.name.startswith('firefox_'):
        shutil.copy2(source, firefox / source.name[8:])

    elif source.name.startswith('chrome_'):
        shutil.copy2(source, chrome / source.name[7:])

    else:
        shutil.copy2(source, firefox / source.name)
        shutil.copy2(source, chrome / source.name)

def delete(source):
    if source.name.startswith('firefox_'):
        os.remove(firefox / source.name[8:])

    elif source.name.startswith('chrome_'):
        os.remove(chrome / source.name[7:])

    else:
        os.remove(firefox / source.name)
        os.remove(chrome / source.name)

def rename(source, destination):
    delete(source)
    copy(destination)

class EventHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        print(event.event_type, event.src_path)
        copy(Path(event.src_path))

    def on_modified(self, event):
        if event.is_directory:
            return
        print(event.event_type, event.src_path)
        copy(Path(event.src_path))

    def on_deleted(self, event):
        if event.is_directory:
            return
        print(event.event_type, event.src_path)
        delete(Path(event.src_path))

    def on_moved(self, event):
        if event.is_directory:
            return
        print(event.event_type, event.src_path, event.dest_path)
        rename(Path(event.src_path), Path(event.dest_path))

if __name__ == "__main__":
    for f in src.iterdir():
        copy(f)

    event_handler = EventHandler()
    observer = Observer()
    observer.schedule(event_handler, str(src), recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        shutil.rmtree(firefox)
        shutil.rmtree(chrome)
    observer.join()
