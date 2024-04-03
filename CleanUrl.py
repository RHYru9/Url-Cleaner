import argparse
from urllib.parse import urlparse

def filter_urls(url_list):
    unique_urls = {}
    
    for url in url_list:
        # Parsing URL
        parsed_url = urlparse(url.strip())

        # Removing duplicate URLs
        if parsed_url.netloc not in unique_urls:
            unique_urls[parsed_url.netloc] = parsed_url.geturl()

    return list(unique_urls.values())

def remove_http_variations(url):
    variations = ["http://", "https://", "http://www.", "https://www."]
    
    for variation in variations:
        if url.startswith(variation):
            return url[len(variation):]
    
    return url

def add_http_www(url):
    if not url.startswith("http://") and not url.startswith("https://"):
        return "http://www." + url
    return url

def filter_and_clean_urls(url_list):
    filtered_urls = []

    for url in url_list:
        # Remove HTTP variations
        url = remove_http_variations(url)
        
        # Add http://www. if needed
        url = add_http_www(url)

        # Remove parameters, subfolders, leaving only the host/subdomain
        parsed_url = urlparse(url)
        cleaned_url = parsed_url.scheme + "://" + parsed_url.netloc
        filtered_urls.append(cleaned_url)

    return filter_urls(filtered_urls)

def save_to_file(url_list, filename="hasil.txt"):
    with open(filename, "w") as file:
        for url in url_list:
            file.write(url + "\n")

def main():
    # Menampilkan banner
    banner = ("""
          ______ _          ______ _   _  _____  
          | ___ \ |         | ___ \ | | ||  _  | 
          | |_/ / |__  _   _| |_/ / | | || |_| | 
          |    /| '_ \| | | |    /| | | |\____ | 
          | |\ \| | | | |_| | |\ \| |_| |.___/ / 
          \_| \_|_| |_|\__, \_| \_|\___/ \____(_)
                        __/ |                    
                       |___/                     
    """)
    print(banner)

    parser = argparse.ArgumentParser(description="URL Filter Tool")
    parser.add_argument("-L", "--url_list_file", help="Path to the file containing URLs to be cleaned")
    args = parser.parse_args()

    if args.url_list_file:
        with open(args.url_list_file, "r") as file:
            urls = file.readlines()
            urls = [url.split()[0] for url in urls if url.strip()]  # Mengambil hanya bagian pertama dari setiap baris (URL)
            filtered_urls = filter_and_clean_urls(urls)
            save_to_file(filtered_urls)
            print("Hasil telah disimpan dalam file hasil.txt")
    else:
        print("File URL tidak diberikan. Gunakan opsi -L atau --url_list_file untuk menentukan file URL.")

if __name__ == "__main__":
    main()
