import json
from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path


def zip_dir(zip_file_name, directory, include, ignore):
    with ZipFile(zip_file_name, 'w', compression=ZIP_DEFLATED) as f:
        for file in directory.iterdir():
            if any(file.name.startswith(i) for i in ignore):
                continue

            if file.name.startswith(include):
                f.write(file, file.name[len(include):])

            else:
                f.write(file, file.name)


def exit_if_exists(file):
    if file.exists():
        exit(f'Error: {file} already exists!')

root = Path(__file__).parent.parent
src = root / 'src'
build = root / 'build'

version_declarations = {}
for file in src.iterdir():
    if file.name.endswith('manifest.json'):
        with open(file) as f: 
            data = json.load(f)
        
        version = data['version']
        version_declarations.setdefault(version, []).append(file)

if len(version_declarations) != 1:
    exit('Error: Versions do not match!\n' + '\n'.join(f'  {vers} in {", ".join(str(f) for f in files)}' for vers, files in version_declarations.items()))

version = next(k for k in version_declarations)
print(f'Packaging version {version}')

# Firefox package
ff_unpacked_path = build / f'firefox_unpacked-nor_report-{version}.zip'
exit_if_exists(ff_unpacked_path)

zip_dir(ff_unpacked_path, src, include='firefox_', ignore=['chrome_'])
print(f'Created {ff_unpacked_path}')

# Chrome package
ch_unpacked_path = build / f'chrome_unpacked-nor_report-{version}.zip'
exit_if_exists(ch_unpacked_path)

zip_dir(ch_unpacked_path, src, include='chrome_', ignore=['firefox_'])
print(f'Created {ch_unpacked_path}')

