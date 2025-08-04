from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for your React app

# Load movie data and similarity matrix
movies = pickle.load(open('movie_list.pkl', 'rb'))
similarity = pickle.load(open('similarity.pkl', 'rb'))

# TMDB API Key (Keep it safe, use env variables in production)
API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MGZhODhiZjNhNzE1ZGVjZjQ5ZDgwYmJlNDdiNTQyNiIsIm5iZiI6MTcyMTI0NDE5Ny4zNjgsInN1YiI6IjY2OTgxYTI1YzU3ZDRhYWM1YTIzMTA5ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.W_ZsJoLnsqqzuMjvWBdrXRAtfD_mmoUOf_W4aYZpESQ"


def get_recommendations_by_tmdb_id(tmdb_id):
    """
    Get top 5 movie recommendations based on TMDB ID
    """
    try:
        # Convert tmdb_id to int for comparison
        tmdb_id = int(tmdb_id)
        print(f"Looking for movie with TMDB ID: {tmdb_id}")
        
        # Find the movie by TMDB_Id
        movie_row = movies[movies['TMDB_Id'] == tmdb_id]
        if movie_row.empty:
            print(f"Movie with TMDB ID {tmdb_id} not found in dataset")
            print(f"Available TMDB IDs sample: {movies['TMDB_Id'].head(10).tolist()}")
            return []
        
        # Get the index of the movie in the similarity matrix
        index = movie_row.index[0]
        movie_title = movie_row.iloc[0]['Title']
        print(f"Found movie: {movie_title} at index {index}")
        
        # Get similarity scores for this movie
        similarity_scores = list(enumerate(similarity[index]))
        
        # Sort by similarity score (descending) and skip the first one (itself)
        sorted_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)[1:6]
        
        recommendations = []
        for movie_index, score in sorted_scores:
            recommended_movie = movies.iloc[movie_index]
            recommendations.append({
                "tmdb_id": str(int(recommended_movie['TMDB_Id'])),
                "title": recommended_movie['Title'],
                "similarity_score": float(score)
            })
        
        print(f"Generated {len(recommendations)} recommendations for '{movie_title}'")
        for i, rec in enumerate(recommendations):
            print(f"  {i+1}. {rec['title']} (Score: {rec['similarity_score']:.3f})")
        
        return recommendations
    
    except Exception as e:
        print(f"Error in get_recommendations_by_tmdb_id: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Movie Recommendation API is running",
        "endpoint": "/recommend-by-id (POST)",
        "sample_request": {
            "tmdb_id": "12259"
        }
    })


@app.route("/recommend-by-id", methods=["POST"])
def api_recommend_by_id():
    try:
        data = request.get_json()
        tmdb_id = data.get('tmdb_id')
        
        if not tmdb_id:
            return jsonify({"error": "TMDB ID is required"}), 400
        
        recommendations = get_recommendations_by_tmdb_id(tmdb_id)
        
        return jsonify({
            "success": True,
            "tmdb_id": tmdb_id,
            "recommendations": recommendations
        })
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
