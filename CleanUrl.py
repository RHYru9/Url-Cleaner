import argparse
from urllib.parse import urlparse
#RhyRU9.
def filter_urls(url_list):
    unique_urls = {}
    
    for url in url_list:

        parsed_url = urlparse(url.strip())

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

        url = remove_http_variations(url)
        

        url = add_http_www(url)

        parsed_url = urlparse(url)
        cleaned_url = parsed_url.scheme + "://" + parsed_url.netloc
        filtered_urls.append(cleaned_url)

    return filter_urls(filtered_urls)

def save_to_file(url_list, filename="results.txt"):
    with open(filename, "w") as file:
        for url in url_list:
            file.write(url + "\n")

def main():
    parser = argparse.ArgumentParser(description="URL Filter Tool")
    parser.add_argument("-L", "--url_list_file", help="Path to the file containing URLs to be cleaned")
    args = parser.parse_args()

    if args.url_list_file:
        with open(args.url_list_file, "r") as file:
            urls = file.readlines()
            filtered_urls = filter_and_clean_urls(urls)
            save_to_file(filtered_urls)
            print("the result will be saved in the file result.txt")
    else:
        print("File URL tidak diberikan. Gunakan opsi -L atau --url_list_file untuk menentukan file URL.")

if __name__ == "__main__":
    main()
