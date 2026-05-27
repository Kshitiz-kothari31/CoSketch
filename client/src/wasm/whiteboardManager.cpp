#include <iostream>
#include <set>
#include <string>
#include <vector>
#include <algorithm>
#include <sstream>

#include "CrdtItem.cpp" 
#include "fractionalIndexer.h"

#include <emscripten/bind.h>

using namespace emscripten;

class WhiteboardManager {
    private:
        std::set<CrdtItem> elements;

    public:
        WhiteboardManager() {}

        void addElement(std::string id, std::vector<int> pos, std::string uid, std::string data) {
            // Upsert: Remove existing element with same ID if present
            for (auto it = elements.begin(); it != elements.end(); ++it) {
                if (it->id == id) {
                    elements.erase(it);
                    break;
                }
            }

            CrdtItem newItem;
            newItem.id = id;
            newItem.fractionalPosition = pos;
            newItem.userId = uid;
            newItem.shapeData = data;
            newItem.timestamp = 0;

            elements.insert(newItem);
        }

        void deleteElement(std::string id) {
            for (auto it = elements.begin(); it != elements.end(); ++it) {
                if (it->id == id) {
                    elements.erase(it);
                    break; 
                }
            }
        }

        std::vector<int> generateIntermediate(std::vector<int> p1, std::vector<int> p2) {
            return FractionalIndexer::generateIntermediate(p1, p2);
        }

        std::string getOrderedElements() {
            std::stringstream ss;
            ss << "[";
            for (auto it = elements.begin(); it != elements.end(); ++it) {
                ss << it->shapeData;
                if (std::next(it) != elements.end()) {
                    ss << ",";
                }
            }
            ss << "]";
            return ss.str();
        }

        void clearBoard() {
            elements.clear();
        }

        int getElementCount() {
            return (int)elements.size();
        }
    };

// --- Emscripten Bindings ---
EMSCRIPTEN_BINDINGS(whiteboard_module) {
    emscripten::register_vector<int>("VectorInt");

    emscripten::class_<WhiteboardManager>("WhiteboardManager")
        .constructor<>()
        .function("addElement", &WhiteboardManager::addElement)
        .function("deleteElement", &WhiteboardManager::deleteElement)
        .function("generateIntermediate", &WhiteboardManager::generateIntermediate)
        .function("getOrderedElements", &WhiteboardManager::getOrderedElements)
        .function("clearBoard", &WhiteboardManager::clearBoard)
        .function("getElementCount", &WhiteboardManager::getElementCount);
}