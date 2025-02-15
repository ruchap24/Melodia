import axios from "axios";
import URL from '../../constants.js'
import { likeState } from "../store/atoms/likeState";
import { useSetRecoilState } from "recoil";
import { useFetchLikedSongs } from "./useFetchLikedSongs.js";

export function useHandleRemoveInteraction(){
    const setLiked = useSetRecoilState(likeState);
    const { fetchLikedSongs } = useFetchLikedSongs();

    async function removeInteraction(trackId){
        const id = trackId.$oid ? trackId.$oid : trackId;
        try{
            await axios.delete(
                `${URL}/api/interaction/${id}`,
                {
                    withCredentials: true,
                }
            )
            setLiked((prev)=>
                prev.filter((id)=>id !== trackId)
            );
            fetchLikedSongs();
        }catch(err){
            console.log(err);
        }
    }
    return { removeInteraction };
}